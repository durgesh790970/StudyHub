import os
import sys
from pathlib import Path

base_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(base_dir))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djproject.settings')
import django
django.setup()

from django.test import Client
import json

client = Client()

payload = {
    'item_type': 'pdf',
    'title': 'API Test Item',
    'price': 9.99,
    'file_url': 'http://example.com/api-test.pdf'
}

resp = client.post('/test/create_item/', data=json.dumps(payload), content_type='application/json')
print('status_code=', resp.status_code)
try:
    print('json=', resp.json())
except Exception as e:
    print('response text=', resp.content)
