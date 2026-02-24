from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from knox.models import AuthToken
from .models import User
from .serializers import UserSerializer, LoginSerializer, StaffRegisterSerializer, PatientRegisterSerializer

class LoginAPI(generics.GenericAPIView):
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "token": AuthToken.objects.create(user)[1]
        })

class StaffRegisterAPI(generics.GenericAPIView):
    serializer_class = StaffRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            try:
                user = serializer.save()
                
                # Check if work_id already exists (additional validation)
                if User.objects.filter(work_id=user.work_id).exclude(id=user.id).exists():
                    return Response(
                        {"error": "A user with this work ID already exists."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Staff accounts need verification
                user.is_verified = False
                user.save()
                
                return Response({
                    "user": UserSerializer(user, context=self.get_serializer_context()).data,
                    "token": AuthToken.objects.create(user)[1],
                    "message": "Staff account created successfully. Please wait for administrator verification."
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response(
                    {"error": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PatientRegisterAPI(generics.GenericAPIView):
    serializer_class = PatientRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            try:
                user = serializer.save()
                
                # Patients are auto-verified
                user.is_verified = True
                user.save()
                
                return Response({
                    "user": UserSerializer(user, context=self.get_serializer_context()).data,
                    "token": AuthToken.objects.create(user)[1],
                    "message": "Patient account created successfully."
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response(
                    {"error": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserAPI(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class UserDetailAPI(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    queryset = User.objects.all()

    def get_object(self):
        return self.request.user

# Optional: User verification endpoint for admins
@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def verify_staff(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        if user.is_medical_staff and not user.is_verified:
            user.is_verified = True
            user.verified_at = timezone.now()
            user.save()
            return Response({
                "message": f"Staff member {user.get_full_name()} has been verified."
            })
        else:
            return Response(
                {"error": "User is not a staff member or is already verified."},
                status=status.HTTP_400_BAD_REQUEST
            )
    except User.DoesNotExist:
        return Response(
            {"error": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )
    
class UserDetailAPI(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    queryset = User.objects.all()

    def get_object(self):
        return self.request.user