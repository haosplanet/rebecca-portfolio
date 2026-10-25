# Rebecca Francis - UOL CM3070 Final Year Project

Hi! Welcome to my repository for the CM3070 Final Project. This project investigates how internet memes appear and become viral across different social media platforms, building a data-driven pipeline to forecast meme trends and analyse engagement dynamics.

Title : "Predictive Modelling of Social Media Trend Emergence"

This repository contains all the code, models, and data processing workflows I built for my final year project. 

## 🚀 Project Overview & Objectives

The primary objective of this project was to move beyond traditional post-hoc descriptive analysis and build machine learning models capable of predicting meme virality early. 

Key questions addressed in the project include:
* What features matter most for a meme to go viral?
* How likely is it that a meme will become popular?
* Which platforms and content types help memes spread the most?
* Are there early behavioral or engagement patterns that show if a meme will go viral?

---

## 🛠️ Tech Stack & Libraries

The entire codebase was written from scratch in Python, utilizing a modular design for reproducibility and scalability:
* **Data Manipulation & Processing:** Pandas, NumPy
* **Machine Learning:** Scikit-Learn (Logistic Regression, Random Forest, StratifiedKFold)
* **Deep Learning:** TensorFlow & Keras (Attention-based Bidirectional LSTM models)
* **Natural Language Processing (NLP):** TextBlob (Sentiment analysis)
* **Data Visualization:** Matplotlib, Seaborn
* **API Access:** PRAW (Python Reddit API Wrapper)

---

## 📊 Data Pipeline & Preprocessing

I collected, integrated, and cleaned data from two main sources:
1. **Global Meme Popularity Dataset (Kaggle):** Provided structural metrics like views, likes, shares, comments, and sentiment scores.
2. **Reddit Web Scraping API:** Used PRAW to scrape real-time and historical meme posts from popular subreddits during 2024.

**Preprocessing Steps:**
* Cleaned and standardized column names, unified platform names to Title Case, removed duplicates, and dropped invalid rows.
* Engineered custom categorical features, classifying content into Image, Video, or Shorts and engagement levels into High, Medium, or Low based on interaction thresholds.
* Utilized TextBlob to analyze the emotional tone of captions, assigning polarity scores (-1 to +1) categorized as Positive, Neutral, or Negative.
* Created a binary target variable (Trend), labeling memes with total engagement above the median (50th percentile) as trending (1) and the rest as not-trending (0) to balance class distribution.

---

## 📈 Exploratory Data Analysis (EDA)

Using custom-coded visualisations with Matplotlib and Seaborn, I uncovered key insights:
* **Correlation Heatmaps:** Showed moderate positive correlations among likes, shares, and comments, highlighting a synergistic relationship in user interaction.
* **Boxplots (Sentiment vs. Likes):** Revealed that positive sentiment posts typically attract higher median engagement compared to neutral or negative posts.
* **Time-Series Rolling Averages (7-Day):** Demonstrated that likes are frequent micro-interactions, whereas sharp spikes in shares and comments represent true viral traction.

---

## 🤖 Predictive Models Implemented

I trained and evaluated four distinct models to compare performance:

1. **Baseline Model:** 
   * Predicted the majority class, setting a naive benchmark accuracy of 49.40%.
2. **Logistic Regression Classifier:** 
   * Achieved an accuracy of 72.16% and an AUC-ROC of 81.04%. It offered high precision and interpretability, making it ideal for risk-averse tasks like ad targeting where false positives are costly.
3. **Random Forest Classifier:** 
   * Achieved an accuracy of 75.59% and an AUC-ROC of 83.44%. Feature importance analysis proved that Shares, Likes, and Comments are the paramount predictors of virality, while sentiment and content format have minimal impact.
4. **Attention-Based Bidirectional LSTM Model:** 
   * Built using TensorFlow/Keras with a custom attention mechanism to capture sequential engagement patterns over time. It achieved the highest overall accuracy at 78.26%, an AUC-ROC of 82.51%, and an exceptional recall of 99.61% for trending memes, making it the top performer for early trend detection.

---

## 🔍 Evaluation & Cross-Validation

* **Cross-Validation:** Stratified 5-fold cross-validation confirmed that Logistic Regression (Mean CV Accuracy: 71.39%) and Random Forest (Mean CV Accuracy: 75.99%) generalized reliably with low variance. The LSTM model achieved a higher mean accuracy of 78.27% but exhibited higher variability (SD: 16.17%), indicating sensitivity to data partitioning and temporal clustering.
* **User-Focused Evaluation:** Conducted a mock usability study with digital marketers, content creators, and social media researchers, confirming that the models effectively address industry pain points like late trend alerts and unpredictable virality.
* **CLI Prototype:** Developed a lightweight command-line interface (CLI) application scenario where users can input real-time metrics (likes, shares, comments, sentiment, content type, engagement level) to receive an immediate binary prediction and percentage-based confidence score.

---
