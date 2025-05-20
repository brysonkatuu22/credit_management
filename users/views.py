from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import UserSerializer
from transformers import pipeline
from .models import UserResponse, UserSentimentScoreHistory
import numpy as np
import torch
import torch.nn.functional as F

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]  # Allow anyone to register

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if User.objects.filter(email=request.data.get("email")).exists():
            return Response(
                {"detail": "This email is already linked with an account."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED
        )

# Load DistilBERT model once on startup
#classifier = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
# Load the fine-tuned model from local directory
import os

# Define the path to the fine-tuned model
FINETUNED_MODEL_PATH = r"c:\Users\tatsm\Desktop\Finetuned Sentiment Analysis\finetuning\loan_sentiment_model"

# Check if the model directory exists
if not os.path.exists(FINETUNED_MODEL_PATH):
    print(f"Warning: Fine-tuned model not found at {FINETUNED_MODEL_PATH}. Falling back to default model.")
    classifier = pipeline("sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment")
else:
    print(f"Loading fine-tuned model from {FINETUNED_MODEL_PATH}")
    try:
        classifier = pipeline("sentiment-analysis", model=FINETUNED_MODEL_PATH)
        print("Successfully loaded fine-tuned model")
    except Exception as e:
        print(f"Error loading fine-tuned model: {str(e)}. Falling back to default model.")
        classifier = pipeline("sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment")

class SentimentAnalysisAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            # Log the request data for debugging
            print(f"Request data: {request.data}")

            responses = request.data.get("responses", [])

            if not responses:
                return Response({"error": "No responses provided."}, status=400)

            if not isinstance(responses, list) or not all(isinstance(text, str) for text in responses):
                return Response({"error": "responses must be a list of strings."}, status=400)

            output = []
            intensity_scores = []
        except Exception as e:
            print(f"Error processing request: {str(e)}")
            return Response({"error": f"Error processing request: {str(e)}"}, status=500)

        try:
            for text in responses:
                try:
                    # Skip empty responses
                    if not text.strip():
                        continue

                    # Process text with the model
                    tokens = classifier.tokenizer(text, return_tensors="pt", truncation=True, padding=True)

                    with torch.no_grad():
                        output_logits = classifier.model(**tokens).logits
                        probs = F.softmax(output_logits, dim=-1).squeeze()

                    # CardiffNLP label mapping: [Negative, Neutral, Positive]
                    p_neg = probs[0].item()
                    p_neu = probs[1].item()
                    p_pos = probs[2].item()

                    # Calculate intensity score
                    intensity_score = round(p_pos - p_neg, 4)
                    intensity_scores.append(intensity_score)

                    # Log individual sentiment score
                    print(f"Sentiment Score for text '{text[:50]}...': {intensity_score}")

                    if intensity_score >= 0.6:
                        ordinal = "Very Positive"
                    elif intensity_score >= 0.3:
                        ordinal = "Positive"
                    elif intensity_score > -0.3:
                        ordinal = "Neutral"
                    elif intensity_score > -0.6:
                        ordinal = "Negative"
                    else:
                        ordinal = "Very Negative"

                    # Save the response to the UserResponse model
                    UserResponse.objects.create(
                        user=request.user,
                        response_text=text,
                        sentiment_score=intensity_score,
                        ordinal_sentiment=ordinal
                    )

                    output.append({
                        "text": text,
                        "p_positive": round(p_pos, 4),
                        "p_negative": round(p_neg, 4),
                        "p_neutral": round(p_neu, 4),
                        "intensity_score": intensity_score,
                        "ordinal_sentiment": ordinal
                    })
                except Exception as e:
                    print(f"Error processing text '{text[:50]}...': {str(e)}")
                    # Add a neutral fallback for this response
                    intensity_score = 0.0
                    ordinal = "Neutral"
                    intensity_scores.append(intensity_score)

                    # Save the response with neutral sentiment
                    UserResponse.objects.create(
                        user=request.user,
                        response_text=text,
                        sentiment_score=intensity_score,
                        ordinal_sentiment=ordinal
                    )

                    # Add to output with error flag
                    output.append({
                        "text": text,
                        "error": True,
                        "error_message": str(e),
                        "p_positive": 0.33,
                        "p_negative": 0.33,
                        "p_neutral": 0.34,
                        "intensity_score": intensity_score,
                        "ordinal_sentiment": ordinal
                    })
        except Exception as e:
            print(f"Error processing responses: {str(e)}")
            return Response({"error": f"Error processing responses: {str(e)}"}, status=500)

        # Check if we have any valid responses
        if not intensity_scores:
            return Response({
                "error": "No valid responses were processed. Please try again with different responses.",
                "results": output,
                "average_intensity_score": 0.0,
                "average_ordinal_sentiment": "Neutral"
            }, status=400)

        avg_intensity = round(sum(intensity_scores) / len(intensity_scores), 4)

        # Determine overall ordinal sentiment
        if avg_intensity >= 0.6:
            avg_ordinal = "Very Positive"
        elif avg_intensity >= 0.3:
            avg_ordinal = "Positive"
        elif avg_intensity > -0.3:
            avg_ordinal = "Neutral"
        elif avg_intensity > -0.6:
            avg_ordinal = "Negative"
        else:
            avg_ordinal = "Very Negative"

        # Log the final result
        print(f"Final analysis: {avg_intensity} ({avg_ordinal}) - Processed {len(output)} responses")

        return Response({
            "results": output,
            "average_intensity_score": avg_intensity,
            "average_ordinal_sentiment": avg_ordinal
        })


    print("✅ SentimentAnalysisAPIView has been loaded")

class SentimentDashboardAPIView(APIView):
    def get(self, request):
        # Aggregate sentiment scores for the user
        user_responses = UserResponse.objects.filter(user=request.user).order_by('-created_at')[:10]

        if not user_responses.exists():
            return Response({"error": "No sentiment data found for this user."}, status=400)

        # Calculate average intensity score
        total_score = sum([response.sentiment_score for response in user_responses])
        average_score = total_score / len(user_responses)

        #Normalize the intensity score to a percentage
        normalized_score = (average_score + 1) / 2
        normalized_percentage_score = round(normalized_score *100, 2)

        # Determine the overall ordinal sentiment
        if average_score >= 0.6:
            average_sentiment = "Very Positive"
        elif average_score >= 0.3:
            average_sentiment = "Positive"
        elif average_score > -0.3:
            average_sentiment = "Neutral"
        elif average_score > -0.6:
            average_sentiment = "Negative"
        else:
            average_sentiment = "Very Negative"

        # Save the sentiment history in UserSentimentScoreHistory
        UserSentimentScoreHistory.objects.create(
            user=request.user,
            average_intensity_score=average_score,
            average_ordinal_sentiment=average_sentiment,
            personal_sentiment_score=normalized_percentage_score
        )

        return Response({
            "total score": total_score,
            "average_intensity_score": average_score,
            "average_ordinal_sentiment": average_sentiment,
            "personal_score": normalized_percentage_score
        })

# SentimentTrendAnalysisAPIView - Trend analysis for sentiment scores
class SentimentTrendAnalysisAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Retrieve the sentiment score history for the authenticated user
        sentiment_history = UserSentimentScoreHistory.objects.filter(user=request.user).order_by('-created_at')

        if not sentiment_history:
            return Response({"error": "No sentiment history found for this user."}, status=400)

        # Prepare data for sentiment trend (timestamp and personal_sentiment_score)
        trend_data = [{"timestamp": record.created_at,
                       "personal_sentiment_score": record.personal_sentiment_score} for record in sentiment_history]

        return Response({"sentiment_trend": trend_data})

class SentimentRiskAnalysisAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Get skip_history_update parameter from query string
        skip_history_update = request.query_params.get('skip_history_update', 'false').lower() == 'true'

        # Fetch sentiment history - use last 20 entries instead of 10
        user_sentiment_history = UserSentimentScoreHistory.objects.filter(user=request.user).order_by('-created_at')[:20]

        if not user_sentiment_history:
            return Response({"error": "No sentiment data available."}, status=400)

        # Extract personal sentiment scores
        personal_sentiment_scores = [float(entry.personal_sentiment_score) for entry in user_sentiment_history]

        # Get timestamps for debugging/logging
        timestamps = [entry.created_at.strftime("%Y-%m-%d") for entry in user_sentiment_history]
        print(f"Risk analysis timestamps: {timestamps}")
        print(f"Risk analysis scores: {personal_sentiment_scores}")

        # Compute average sentiment score
        avg_sentiment_score = np.mean(personal_sentiment_scores)

        # Compute sentiment volatility (standard deviation)
        sentiment_volatility = np.std(personal_sentiment_scores)

        # Compute recent change: Difference between the most recent and oldest score
        recent_change = personal_sentiment_scores[0] - personal_sentiment_scores[-1]

        # Categorize risk based on the calculated metrics
        if sentiment_volatility > 15 and recent_change < -10:
            risk_level = "Very High Risk"
        elif sentiment_volatility > 10 and recent_change < -5:
            risk_level = "High Risk"
        elif avg_sentiment_score < 40:
            risk_level = "Moderate Risk"
        else:
            risk_level = "Low Risk"

        print(f"Risk calculation: avg={avg_sentiment_score}, volatility={sentiment_volatility}, change={recent_change}, level={risk_level}")

        # Only save history if not skipping history update
        if not skip_history_update:
            # This is a view-only request, don't update history
            print("Skipping history update for risk analysis view-only request")

        return Response({
            "average_sentiment_score": avg_sentiment_score,
            "sentiment_volatility": sentiment_volatility,
            "recent_change": recent_change,
            "risk_level": risk_level
        })

