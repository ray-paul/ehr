from rest_framework import serializers
from .models import Report
from .models import ReportAttachment


class ReportSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    attachments = serializers.SerializerMethodField()

    def get_attachments(self, obj):
        # return list of attachment metadata with download URLs
        request = self.context.get('request')
        out = []
        for a in obj.attachments.all():
            url = a.file.url if a.file else None
            if request and url and not url.startswith('http'):
                url = request.build_absolute_uri(url)
            out.append({
                'id': a.id,
                'attachment_type': a.attachment_type,
                'file_name': a.file.name.split('/')[-1],
                'url': url,
                'uploaded_at': a.uploaded_at,
            })
        return out

    class Meta:
        model = Report
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by')


class ReportAttachmentSerializer(serializers.ModelSerializer):
    file_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ReportAttachment
        fields = ('id', 'report', 'file', 'file_name', 'attachment_type', 'uploaded_by', 'uploaded_at')
        read_only_fields = ('uploaded_by', 'uploaded_at')

    def get_file_name(self, obj):
        return obj.file.name.split('/')[-1] if obj.file else ''
