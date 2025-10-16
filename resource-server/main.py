import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler, StandardScaler, PolynomialFeatures, OneHotEncoder
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.neural_network import MLPRegressor
from sklearn.feature_selection import SelectKBest, f_regression
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from joblib import load, dump
from xgboost import XGBRegressor
from lightgbm import LGBMRegressor
from catboost import CatBoostRegressor
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.wrappers.scikit_learn import KerasRegressor
from flask import Flask, request, jsonify
from flask_restful import Api, Resource
import logging
import os
from kafka import KafkaProducer, KafkaConsumer
from pyspark.sql import SparkSession
from pyspark.ml.feature import VectorAssembler
from pyspark.ml.regression import GBTRegressor
from pyspark.ml.evaluation import RegressionEvaluator
from pyspark.ml.tuning import ParamGridBuilder, CrossValidator
from pyspark.ml.pipeline import Pipeline as SparkPipeline
from cassandra.cluster import Cluster
from redis import Redis

app = Flask(__name__)
api = Api(app)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Bank options and their respective requirements
bank_options = {
    'Saudi National Bank (SNB)': {
        'url': 'https://www.alahli.com',
        'min_credit_score': 700,
        'max_debt_to_income': 0.35
    },
    'Al Rajhi Bank': {
        'url': 'https://www.alrajhibank.com.sa',
        'min_credit_score': 650,
        'max_debt_to_income': 0.4
    },
    'Riyad Bank': {
        'url': 'https://www.riyadbank.com',
        'min_credit_score': 675,
        'max_debt_to_income': 0.38
    },
    'Arab National Bank (ANB)': {
        'url': 'https://www.anb.com.sa',
        'min_credit_score': 680,
        'max_debt_to_income': 0.37
    },
    'The Saudi Investment Bank (SAIB)': {
        'url': 'https://www.saib.com.sa',
        'min_credit_score': 690,
        'max_debt_to_income': 0.36
    },
    'Alinma Bank': {
        'url': 'https://www.alinma.com',
        'min_credit_score': 660,
        'max_debt_to_income': 0.39
    },
    'Banque Saudi Fransi (BSF)': {
        'url': 'https://www.alfransi.com.sa',
        'min_credit_score': 685,
        'max_debt_to_income': 0.37
    },
    'Bank AlBilad': {
        'url': 'https://www.bankalbilad.com',
        'min_credit_score': 670,
        'max_debt_to_income': 0.38
    },
    'Bank Aljazira': {
        'url': 'https://www.baj.com.sa',
        'min_credit_score': 665,
        'max_debt_to_income': 0.39
    },
    'Gulf International Bank (GIB)': {
        'url': 'https://www.gib.com',
        'min_credit_score': 695,
        'max_debt_to_income': 0.36
    }
}

class LoanScorePredictor(Resource):
    def post(self):
        try:
            loan_option = request.json['loan_option']
            user_info = request.json['user_info']
            loan_requirements = request.json['loan_requirements']

            # Check SAMA regulations and guidelines
            if not is_compliant_with_sama_regulations(loan_option, user_info, loan_requirements):
                return jsonify({'error': 'Loan application does not comply with SAMA regulations'}), 400

            # Check bank-specific requirements
            eligible_banks = get_eligible_banks(user_info)
            if not eligible_banks:
                return jsonify({'error': 'User does not meet the requirements of any bank'}), 400

            loan_score = calculate_loan_score(loan_option, user_info, loan_requirements)

            response = {
                'loan_score': loan_score,
                'eligible_banks': eligible_banks
            }
            return jsonify(response)
        except Exception as e:
            logger.error(f"Error in loan score prediction: {str(e)}")
            return jsonify({'error': f'An error occurred during loan score prediction: {str(e)}'}), 500

def is_compliant_with_sama_regulations(loan_option, user_info, loan_requirements):
    # Check SAMA regulations and guidelines
    # Example checks:
    # - Minimum age requirement (18 years)
    if user_info['age'] < 18:
        return False
    
    # - Maximum debt-to-income ratio (33%)
    debt_to_income = calculate_debt_to_income(user_info['income'], loan_option['monthly_payment'])
    if debt_to_income > 0.33:
        return False
    
    # - Minimum credit score (SIMAH score of 650)
    if user_info['credit_score'] < 650:
        return False
    
    # - Loan purpose restrictions (e.g., no loans for speculative investments)
    if loan_requirements['purpose'] == 'Speculative Investment':
        return False
    
    # - Loan amount limits (e.g., maximum loan amount of 5 million SAR)
    if loan_requirements['amount'] > 5000000:
        return False
    
    # - Interest rate caps (e.g., maximum interest rate of 5%)
    if loan_option['interest_rate'] > 0.05:
        return False
    
    # Return True if the loan application is compliant, False otherwise
    return True

def get_eligible_banks(user_info):
    eligible_banks = []
    for bank, requirements in bank_options.items():
        if user_info['
