"""
Model Evaluation Script

Evaluates trained models and generates performance metrics.
"""

import sys
from pathlib import Path

# Add project root
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score
import matplotlib.pyplot as plt
import seaborn as sns

from config import MODELS_DIR, DATA_DIR, CRIME_CATEGORIES


def load_test_data():
    """Load test dataset."""
    test_path = DATA_DIR / "processed" / "test.csv"
    if not test_path.exists():
        print("Test data not found. Generate dataset first.")
        return None, None
    
    df = pd.read_csv(test_path)
    return df['text'].tolist(), df['label'].tolist()


def evaluate_baseline():
    """Evaluate baseline model."""
    from src.models.baseline_model import BaselineClassifier
    from src.features.feature_extractor import TFIDFExtractor
    from src.preprocessing.text_processor import TextProcessor
    
    print("=" * 60)
    print("Evaluating Baseline Model")
    print("=" * 60)
    
    # Load model and vectorizer
    model_path = MODELS_DIR / "baseline" / "logistic_regression_model.pkl"
    vectorizer_path = MODELS_DIR / "baseline" / "tfidf_vectorizer.pkl"
    
    if not model_path.exists() or not vectorizer_path.exists():
        print("Baseline model not found. Train first with: python scripts/train_baseline.py")
        return None
    
    model = BaselineClassifier.load(model_path)
    vectorizer = TFIDFExtractor()
    vectorizer.load(vectorizer_path)
    
    # Load test data
    texts, labels = load_test_data()
    if texts is None:
        return None
    
    # Preprocess and transform
    processor = TextProcessor()
    processed = [processor.preprocess(t) for t in texts]
    features = vectorizer.transform(processed)
    
    # Predict
    predictions = model.predict(features)
    
    # Calculate metrics
    accuracy = accuracy_score(labels, predictions)
    f1 = f1_score(labels, predictions, average='weighted')
    
    print(f"\nResults:")
    print(f"  Accuracy: {accuracy:.4f} ({accuracy*100:.1f}%)")
    print(f"  F1 Score: {f1:.4f}")
    print(f"\n{'✅ TARGET MET!' if accuracy >= 0.90 else '⚠️ Below 90% target'}")
    
    print("\nClassification Report:")
    print(classification_report(labels, predictions))
    
    # Confusion matrix
    cm = confusion_matrix(labels, predictions, labels=CRIME_CATEGORIES)
    
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=CRIME_CATEGORIES,
                yticklabels=CRIME_CATEGORIES)
    plt.title('Confusion Matrix - Baseline Model')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    
    output_path = MODELS_DIR / "baseline" / "confusion_matrix.png"
    plt.savefig(output_path, dpi=150)
    print(f"\nConfusion matrix saved to: {output_path}")
    
    return {'accuracy': accuracy, 'f1': f1}


def evaluate_bert():
    """Evaluate BERT model."""
    from src.models.bert_classifier import BERTClassifier
    from src.preprocessing.text_processor import TextProcessor
    
    print("\n" + "=" * 60)
    print("Evaluating BERT Model")
    print("=" * 60)
    
    model_path = MODELS_DIR / "bert" / "final_model"
    
    if not model_path.exists():
        print("BERT model not found. Train first with: python scripts/train_bert.py")
        return None
    
    model = BERTClassifier.load(model_path)
    
    # Load test data
    texts, labels = load_test_data()
    if texts is None:
        return None
    
    # Preprocess
    processor = TextProcessor()
    processed = [processor.preprocess(t) for t in texts]
    
    # Predict (in batches to avoid memory issues)
    print("Running predictions...")
    predictions = []
    batch_size = 32
    
    for i in range(0, len(processed), batch_size):
        batch = processed[i:i+batch_size]
        preds = model.predict(batch)
        predictions.extend([p['label'] for p in preds])
        print(f"  Processed {min(i+batch_size, len(processed))}/{len(processed)}")
    
    # Calculate metrics
    accuracy = accuracy_score(labels, predictions)
    f1 = f1_score(labels, predictions, average='weighted')
    
    print(f"\nResults:")
    print(f"  Accuracy: {accuracy:.4f} ({accuracy*100:.1f}%)")
    print(f"  F1 Score: {f1:.4f}")
    print(f"\n{'✅ TARGET MET!' if accuracy >= 0.90 else '⚠️ Below 90% target'}")
    
    print("\nClassification Report:")
    print(classification_report(labels, predictions))
    
    return {'accuracy': accuracy, 'f1': f1}


def main():
    print("\n" + "=" * 60)
    print("Model Evaluation Report")
    print("=" * 60 + "\n")
    
    baseline_metrics = evaluate_baseline()
    bert_metrics = evaluate_bert()
    
    # Summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    
    if baseline_metrics:
        print(f"\nBaseline Model:")
        print(f"  Accuracy: {baseline_metrics['accuracy']:.4f}")
        print(f"  F1 Score: {baseline_metrics['f1']:.4f}")
    
    if bert_metrics:
        print(f"\nBERT Model:")
        print(f"  Accuracy: {bert_metrics['accuracy']:.4f}")
        print(f"  F1 Score: {bert_metrics['f1']:.4f}")
    
    # Compare
    if baseline_metrics and bert_metrics:
        if bert_metrics['accuracy'] > baseline_metrics['accuracy']:
            print("\n🏆 BERT model performs better!")
        else:
            print("\n🏆 Baseline model performs better!")


if __name__ == "__main__":
    main()
