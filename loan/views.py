from rest_framework import generics, permissions
from .models import LoanAccount
from .serializers import LoanAccountSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import date, timedelta


class LoanAccountListView(generics.ListAPIView):
    serializer_class = LoanAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LoanAccount.objects.filter(user=self.request.user)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def due_loans(request):
    today = date.today()
    cutoff_date = today + timedelta(weeks=4)

    due_loans = LoanAccount.objects.filter(
        user=request.user,
        end_date__range=(today, cutoff_date),
        status='active'
    )

    serializer = LoanAccountSerializer(due_loans, many=True)
    return Response(serializer.data)