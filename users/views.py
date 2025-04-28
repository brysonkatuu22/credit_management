from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate
from .serializers import UserSerializer

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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_password(request):
    """
    Verify a user's password for security confirmation.
    Used for sensitive operations like generating reports.
    """
    user = request.user
    password = request.data.get('password')

    if not password:
        return Response(
            {"detail": "Password is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if the provided password is correct
    auth_user = authenticate(username=user.email, password=password)

    if auth_user is None:
        return Response(
            {"detail": "Incorrect password."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    return Response(
        {"detail": "Password verified successfully."},
        status=status.HTTP_200_OK
    )