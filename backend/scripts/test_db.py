import os
from pathlib import Path

# Ensure Django settings are available
import sys

# Make sure `backend` is on Python path so `djproject` package can be imported
base_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(base_dir))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djproject.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import UserProfile, Item, PurchasedItem

User = get_user_model()

def main():
    user, created = User.objects.get_or_create(username='teststudent', defaults={'email': 'test@student.com'})
    if created:
        user.set_password('testpass')
        user.save()

    profile, pcreated = UserProfile.objects.get_or_create(auth_user=user, defaults={'phone': '+911234567890'})

    item, icreated = Item.objects.get_or_create(
        title='Test PDF',
        defaults={'item_type': 'pdf', 'description': 'Test PDF for DB check', 'price': 0, 'file_url': 'http://example.com/test.pdf'}
    )

    purchased, purchased_created = PurchasedItem.objects.get_or_create(
        user=user,
        item=item,
        defaults={
            'title': item.title,
            'item_type': item.item_type,
            'amount_paid': 0,
        }
    )

    print('user.id=', user.id)
    print('user.created=', created)
    print('profile.id=', profile.id)
    print('item.id=', item.id)
    print('purchased.id=', purchased.id)

if __name__ == '__main__':
    main()
