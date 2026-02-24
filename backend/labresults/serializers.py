from rest_framework import serializers
from .models import LabTestType, LabOrder, LabResult, LabAttachment
from patients.serializers import PatientSerializer
from accounts.serializers import UserSerializer

class LabTestTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabTestType
        fields = '__all__'

class LabResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabResult
        fields = '__all__'

class LabAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    
    class Meta:
        model = LabAttachment
        fields = '__all__'

class LabOrderSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    ordered_by_name = serializers.CharField(source='ordered_by.get_full_name', read_only=True)
    collected_by_name = serializers.CharField(source='collected_by.get_full_name', read_only=True)
    test_type_details = LabTestTypeSerializer(source='test_type', read_only=True)
    results = LabResultSerializer(many=True, read_only=True)
    attachments = LabAttachmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = LabOrder
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class LabOrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabOrder
        fields = ('patient', 'test_type', 'priority', 'clinical_notes')
    
    def create(self, validated_data):
        validated_data['ordered_by'] = self.context['request'].user
        return super().create(validated_data)

class LabResultCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabResult
        fields = ('parameter', 'value', 'unit', 'reference_range', 'is_abnormal', 'notes')