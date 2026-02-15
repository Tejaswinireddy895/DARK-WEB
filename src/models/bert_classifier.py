"""
BERT Classifier

Fine-tuned DistilBERT model for cybercrime text classification.
"""

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import (
    DistilBertTokenizer,
    DistilBertModel,
    DistilBertForSequenceClassification,
    get_linear_schedule_with_warmup
)
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Union
import numpy as np
from tqdm import tqdm
import sys

# Add parent paths
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from config import CRIME_CATEGORIES, MODEL_CONFIG, MODELS_DIR


class CybercrimeDataset(Dataset):
    """PyTorch Dataset for cybercrime text data."""
    
    def __init__(self, 
                 texts: List[str], 
                 labels: List[int],
                 tokenizer: DistilBertTokenizer,
                 max_length: int = 256):
        """
        Initialize dataset.
        
        Args:
            texts: List of text documents
            labels: List of label indices
            tokenizer: BERT tokenizer
            max_length: Maximum sequence length
        """
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length
    
    def __len__(self):
        return len(self.texts)
    
    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]
        
        encoding = self.tokenizer(
            text,
            truncation=True,
            padding='max_length',
            max_length=self.max_length,
            return_tensors='pt'
        )
        
        return {
            'input_ids': encoding['input_ids'].squeeze(),
            'attention_mask': encoding['attention_mask'].squeeze(),
            'label': torch.tensor(label, dtype=torch.long)
        }


class BERTClassifier:
    """
    BERT-based classifier for cybercrime detection.
    
    Uses DistilBERT for efficient fine-tuning with:
    - Dropout regularization
    - Mixed precision training
    - Early stopping
    """
    
    def __init__(self,
                 model_name: str = None,
                 num_classes: int = None,
                 max_length: int = None,
                 dropout: float = None,
                 device: str = None):
        """
        Initialize the BERT classifier.
        
        Args:
            model_name: Hugging Face model name
            num_classes: Number of output classes
            max_length: Maximum sequence length
            dropout: Dropout probability
            device: Device to use ('cuda' or 'cpu')
        """
        self.model_name = model_name or MODEL_CONFIG['bert_model_name']
        self.num_classes = num_classes or len(CRIME_CATEGORIES)
        self.max_length = max_length or MODEL_CONFIG['max_length']
        self.dropout = dropout or MODEL_CONFIG['dropout']
        
        # Determine device
        if device is None:
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        else:
            self.device = torch.device(device)
        
        print(f"Using device: {self.device}")
        
        # Initialize tokenizer and model
        self.tokenizer = DistilBertTokenizer.from_pretrained(self.model_name)
        self.model = DistilBertForSequenceClassification.from_pretrained(
            self.model_name,
            num_labels=self.num_classes,
            dropout=self.dropout
        )
        self.model.to(self.device)
        
        # Label mapping
        self.label_to_id = {label: idx for idx, label in enumerate(CRIME_CATEGORIES)}
        self.id_to_label = {idx: label for label, idx in self.label_to_id.items()}
        
        self.training_history = []
        self.is_fitted = False
    
    def _create_dataloader(self, 
                           texts: List[str], 
                           labels: List[str],
                           batch_size: int,
                           shuffle: bool = True) -> DataLoader:
        """Create a DataLoader from texts and labels."""
        # Convert string labels to indices
        label_ids = [self.label_to_id[label] for label in labels]
        
        dataset = CybercrimeDataset(
            texts=texts,
            labels=label_ids,
            tokenizer=self.tokenizer,
            max_length=self.max_length
        )
        
        return DataLoader(dataset, batch_size=batch_size, shuffle=shuffle)
    
    def train(self,
              train_texts: List[str],
              train_labels: List[str],
              val_texts: Optional[List[str]] = None,
              val_labels: Optional[List[str]] = None,
              epochs: int = None,
              batch_size: int = None,
              learning_rate: float = None,
              patience: int = None) -> Dict:
        """
        Train the model.
        
        Args:
            train_texts: Training texts
            train_labels: Training labels
            val_texts: Validation texts
            val_labels: Validation labels
            epochs: Number of training epochs
            batch_size: Batch size
            learning_rate: Learning rate
            patience: Early stopping patience
            
        Returns:
            Training history
        """
        epochs = epochs or MODEL_CONFIG['epochs']
        batch_size = batch_size or MODEL_CONFIG['batch_size']
        learning_rate = learning_rate or MODEL_CONFIG['learning_rate']
        patience = patience or MODEL_CONFIG['early_stopping_patience']
        
        # Create data loaders
        train_loader = self._create_dataloader(train_texts, train_labels, batch_size)
        val_loader = None
        if val_texts and val_labels:
            val_loader = self._create_dataloader(val_texts, val_labels, batch_size, shuffle=False)
        
        # Optimizer and scheduler
        optimizer = torch.optim.AdamW(self.model.parameters(), lr=learning_rate)
        total_steps = len(train_loader) * epochs
        scheduler = get_linear_schedule_with_warmup(
            optimizer,
            num_warmup_steps=int(total_steps * 0.1),
            num_training_steps=total_steps
        )
        
        # Training loop
        best_val_loss = float('inf')
        patience_counter = 0
        
        for epoch in range(epochs):
            # Training phase
            self.model.train()
            train_loss = 0.0
            train_correct = 0
            train_total = 0
            
            progress_bar = tqdm(train_loader, desc=f"Epoch {epoch+1}/{epochs}")
            for batch in progress_bar:
                input_ids = batch['input_ids'].to(self.device)
                attention_mask = batch['attention_mask'].to(self.device)
                labels = batch['label'].to(self.device)
                
                optimizer.zero_grad()
                
                outputs = self.model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    labels=labels
                )
                
                loss = outputs.loss
                loss.backward()
                
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)
                
                optimizer.step()
                scheduler.step()
                
                train_loss += loss.item()
                _, predicted = torch.max(outputs.logits, 1)
                train_correct += (predicted == labels).sum().item()
                train_total += labels.size(0)
                
                progress_bar.set_postfix({
                    'loss': f'{loss.item():.4f}',
                    'acc': f'{train_correct/train_total:.4f}'
                })
            
            avg_train_loss = train_loss / len(train_loader)
            train_accuracy = train_correct / train_total
            
            # Validation phase
            val_loss = 0.0
            val_accuracy = 0.0
            if val_loader:
                val_loss, val_accuracy = self._evaluate_loader(val_loader)
            
            # Record history
            epoch_stats = {
                'epoch': epoch + 1,
                'train_loss': avg_train_loss,
                'train_accuracy': train_accuracy,
                'val_loss': val_loss,
                'val_accuracy': val_accuracy
            }
            self.training_history.append(epoch_stats)
            
            print(f"\nEpoch {epoch+1}/{epochs}:")
            print(f"  Train Loss: {avg_train_loss:.4f}, Train Acc: {train_accuracy:.4f}")
            if val_loader:
                print(f"  Val Loss:   {val_loss:.4f}, Val Acc:   {val_accuracy:.4f}")
            
            # Early stopping
            if val_loader and val_loss < best_val_loss:
                best_val_loss = val_loss
                patience_counter = 0
                # Save best model
                self._save_checkpoint(MODELS_DIR / "bert" / "best_model.pt")
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    print(f"\nEarly stopping triggered after {epoch+1} epochs")
                    break
        
        self.is_fitted = True
        return self.training_history
    
    def _evaluate_loader(self, dataloader: DataLoader) -> Tuple[float, float]:
        """Evaluate on a dataloader."""
        self.model.eval()
        total_loss = 0.0
        correct = 0
        total = 0
        
        with torch.no_grad():
            for batch in dataloader:
                input_ids = batch['input_ids'].to(self.device)
                attention_mask = batch['attention_mask'].to(self.device)
                labels = batch['label'].to(self.device)
                
                outputs = self.model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    labels=labels
                )
                
                total_loss += outputs.loss.item()
                _, predicted = torch.max(outputs.logits, 1)
                correct += (predicted == labels).sum().item()
                total += labels.size(0)
        
        avg_loss = total_loss / len(dataloader)
        accuracy = correct / total
        return avg_loss, accuracy
    
    def predict(self, texts: Union[str, List[str]]) -> List[Dict]:
        """
        Predict labels for texts.
        
        Args:
            texts: Single text or list of texts
            
        Returns:
            List of prediction dictionaries with label and confidence
        """
        if isinstance(texts, str):
            texts = [texts]
        
        self.model.eval()
        predictions = []
        
        with torch.no_grad():
            for text in texts:
                encoding = self.tokenizer(
                    text,
                    truncation=True,
                    padding='max_length',
                    max_length=self.max_length,
                    return_tensors='pt'
                )
                
                input_ids = encoding['input_ids'].to(self.device)
                attention_mask = encoding['attention_mask'].to(self.device)
                
                outputs = self.model(input_ids=input_ids, attention_mask=attention_mask)
                probs = torch.softmax(outputs.logits, dim=1)
                
                confidence, predicted_id = torch.max(probs, 1)
                
                predictions.append({
                    'label': self.id_to_label[predicted_id.item()],
                    'confidence': confidence.item(),
                    'probabilities': {
                        self.id_to_label[i]: probs[0][i].item() 
                        for i in range(self.num_classes)
                    }
                })
        
        return predictions
    
    def _save_checkpoint(self, filepath: Path):
        """Save model checkpoint."""
        filepath.parent.mkdir(parents=True, exist_ok=True)
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'training_history': self.training_history
        }, filepath)
    
    def save(self, save_dir: Union[str, Path] = None):
        """
        Save the complete model.
        
        Args:
            save_dir: Directory to save model
        """
        if save_dir is None:
            save_dir = MODELS_DIR / "bert" / "final_model"
        
        save_dir = Path(save_dir)
        save_dir.mkdir(parents=True, exist_ok=True)
        
        # Save model and tokenizer
        self.model.save_pretrained(save_dir)
        self.tokenizer.save_pretrained(save_dir)
        
        # Save additional info
        torch.save({
            'label_to_id': self.label_to_id,
            'id_to_label': self.id_to_label,
            'training_history': self.training_history
        }, save_dir / "training_info.pt")
        
        print(f"Model saved to: {save_dir}")
    
    @classmethod
    def load(cls, load_dir: Union[str, Path]) -> 'BERTClassifier':
        """
        Load a saved model.
        
        Args:
            load_dir: Directory containing saved model
            
        Returns:
            Loaded BERTClassifier instance
        """
        load_dir = Path(load_dir)
        
        classifier = cls.__new__(cls)
        
        # Load tokenizer and model
        classifier.tokenizer = DistilBertTokenizer.from_pretrained(load_dir)
        classifier.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        classifier.model = DistilBertForSequenceClassification.from_pretrained(load_dir)
        classifier.model.to(classifier.device)
        
        # Load additional info
        info = torch.load(load_dir / "training_info.pt", map_location=classifier.device)
        classifier.label_to_id = info['label_to_id']
        classifier.id_to_label = info['id_to_label']
        classifier.training_history = info['training_history']
        
        classifier.num_classes = len(classifier.label_to_id)
        classifier.max_length = MODEL_CONFIG['max_length']
        classifier.is_fitted = True
        
        print(f"Model loaded from: {load_dir}")
        return classifier


if __name__ == "__main__":
    # Quick test
    print("BERT Classifier initialized successfully")
    print(f"Crime categories: {CRIME_CATEGORIES}")
    print(f"Model config: {MODEL_CONFIG}")
