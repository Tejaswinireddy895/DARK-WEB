"""
Baseline ML Models

Traditional machine learning models using TF-IDF features for text classification.
Provides Logistic Regression and SVM classifiers with hyperparameter tuning.
"""

import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Union
import pickle
import sys

# Add parent paths
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.model_selection import GridSearchCV, cross_val_score
from sklearn.metrics import (
    classification_report, 
    confusion_matrix, 
    accuracy_score,
    f1_score,
    precision_score,
    recall_score
)
from sklearn.preprocessing import LabelEncoder

from config import CRIME_CATEGORIES, MODELS_DIR


class BaselineClassifier:
    """
    Baseline classifier using traditional ML algorithms.
    
    Supports:
    - Logistic Regression
    - Support Vector Machine (SVM)
    - Hyperparameter tuning via GridSearchCV
    """
    
    def __init__(self, 
                 model_type: str = "logistic_regression",
                 random_state: int = 42):
        """
        Initialize the classifier.
        
        Args:
            model_type: Type of model ('logistic_regression' or 'svm')
            random_state: Random seed for reproducibility
        """
        self.model_type = model_type
        self.random_state = random_state
        self.model = None
        self.label_encoder = LabelEncoder()
        self.is_fitted = False
        self.best_params = None
        self.metrics = {}
        
        self._init_model()
    
    def _init_model(self):
        """Initialize the model based on type."""
        if self.model_type == "logistic_regression":
            self.model = LogisticRegression(
                max_iter=1000,
                random_state=self.random_state,
                class_weight='balanced',
                multi_class='multinomial',
                solver='lbfgs'
            )
            self.param_grid = {
                'C': [0.1, 1.0, 10.0],
                'penalty': ['l2']
            }
        elif self.model_type == "svm":
            self.model = SVC(
                random_state=self.random_state,
                class_weight='balanced',
                probability=True
            )
            self.param_grid = {
                'C': [0.1, 1.0, 10.0],
                'kernel': ['rbf', 'linear'],
                'gamma': ['scale', 'auto']
            }
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")
    
    def fit(self, 
            X_train: np.ndarray, 
            y_train: List[str],
            tune_hyperparams: bool = True,
            cv: int = 5) -> 'BaselineClassifier':
        """
        Fit the classifier.
        
        Args:
            X_train: Training features
            y_train: Training labels
            tune_hyperparams: Whether to perform hyperparameter tuning
            cv: Number of cross-validation folds
            
        Returns:
            Self for chaining
        """
        # Encode labels
        y_encoded = self.label_encoder.fit_transform(y_train)
        
        if tune_hyperparams:
            print(f"Tuning hyperparameters for {self.model_type}...")
            grid_search = GridSearchCV(
                self.model,
                self.param_grid,
                cv=cv,
                scoring='f1_weighted',
                n_jobs=-1,
                verbose=1
            )
            grid_search.fit(X_train, y_encoded)
            self.model = grid_search.best_estimator_
            self.best_params = grid_search.best_params_
            print(f"Best parameters: {self.best_params}")
        else:
            self.model.fit(X_train, y_encoded)
        
        self.is_fitted = True
        return self
    
    def predict(self, X: np.ndarray) -> List[str]:
        """
        Predict labels for samples.
        
        Args:
            X: Feature matrix
            
        Returns:
            List of predicted labels
        """
        if not self.is_fitted:
            raise ValueError("Model not fitted. Call fit() first.")
        
        y_pred = self.model.predict(X)
        return self.label_encoder.inverse_transform(y_pred).tolist()
    
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """
        Predict class probabilities.
        
        Args:
            X: Feature matrix
            
        Returns:
            Probability matrix [n_samples, n_classes]
        """
        if not self.is_fitted:
            raise ValueError("Model not fitted. Call fit() first.")
        
        return self.model.predict_proba(X)
    
    def evaluate(self, X_test: np.ndarray, y_test: List[str]) -> Dict:
        """
        Evaluate the model on test data.
        
        Args:
            X_test: Test features
            y_test: Test labels
            
        Returns:
            Dictionary of metrics
        """
        y_pred = self.predict(X_test)
        
        self.metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'f1_weighted': f1_score(y_test, y_pred, average='weighted'),
            'f1_macro': f1_score(y_test, y_pred, average='macro'),
            'precision_weighted': precision_score(y_test, y_pred, average='weighted'),
            'recall_weighted': recall_score(y_test, y_pred, average='weighted'),
        }
        
        print("\n" + "="*60)
        print(f"Model Evaluation: {self.model_type}")
        print("="*60)
        print(f"Accuracy:  {self.metrics['accuracy']:.4f}")
        print(f"F1 Score:  {self.metrics['f1_weighted']:.4f}")
        print(f"Precision: {self.metrics['precision_weighted']:.4f}")
        print(f"Recall:    {self.metrics['recall_weighted']:.4f}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))
        print("\nConfusion Matrix:")
        print(confusion_matrix(y_test, y_pred))
        
        return self.metrics
    
    def get_classes(self) -> List[str]:
        """Get the list of class labels."""
        return self.label_encoder.classes_.tolist()
    
    def save(self, filepath: Union[str, Path] = None) -> str:
        """
        Save the model to disk.
        
        Args:
            filepath: Path to save model (uses default if None)
            
        Returns:
            Path where model was saved
        """
        if filepath is None:
            filepath = MODELS_DIR / "baseline" / f"{self.model_type}_model.pkl"
        
        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        save_dict = {
            'model': self.model,
            'label_encoder': self.label_encoder,
            'model_type': self.model_type,
            'best_params': self.best_params,
            'metrics': self.metrics
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(save_dict, f)
        
        print(f"Model saved to: {filepath}")
        return str(filepath)
    
    @classmethod
    def load(cls, filepath: Union[str, Path]) -> 'BaselineClassifier':
        """
        Load a model from disk.
        
        Args:
            filepath: Path to saved model
            
        Returns:
            Loaded BaselineClassifier instance
        """
        with open(filepath, 'rb') as f:
            save_dict = pickle.load(f)
        
        classifier = cls(model_type=save_dict['model_type'])
        classifier.model = save_dict['model']
        classifier.label_encoder = save_dict['label_encoder']
        classifier.best_params = save_dict['best_params']
        classifier.metrics = save_dict['metrics']
        classifier.is_fitted = True
        
        print(f"Model loaded from: {filepath}")
        return classifier


if __name__ == "__main__":
    # Quick test with dummy data
    from sklearn.datasets import make_classification
    
    # Create dummy multi-class data
    X, y = make_classification(
        n_samples=500,
        n_features=100,
        n_informative=50,
        n_classes=7,
        random_state=42
    )
    
    # Map to category names
    categories = CRIME_CATEGORIES[:7]
    y_labels = [categories[i] for i in y]
    
    # Split
    from sklearn.model_selection import train_test_split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_labels, test_size=0.2, random_state=42
    )
    
    # Train and evaluate
    print("Testing Logistic Regression...")
    lr_model = BaselineClassifier(model_type="logistic_regression")
    lr_model.fit(X_train, y_train, tune_hyperparams=False)
    lr_model.evaluate(X_test, y_test)
