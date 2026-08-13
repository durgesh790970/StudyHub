import time
import json

try:
    import requests
except Exception:
    requests = None

BASE = 'http://127.0.0.1:8000'


def http_post(path, data, headers=None):
    url = BASE + path
    if requests:
        r = requests.post(url, json=data, headers=headers or {})
        return r.status_code, r.text, r
    else:
        import urllib.request
        req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json', **(headers or {})})
        with urllib.request.urlopen(req) as resp:
            return resp.getcode(), resp.read().decode('utf-8'), None


def http_get(path, headers=None):
    url = BASE + path
    if requests:
        r = requests.get(url, headers=headers or {})
        return r.status_code, r.text, r
    else:
        import urllib.request
        req = urllib.request.Request(url, headers=headers or {})
        with urllib.request.urlopen(req) as resp:
            return resp.getcode(), resp.read().decode('utf-8'), None


if __name__ == '__main__':
    print('Waiting for server to be ready...')
    for i in range(15):
        try:
            code, text, _ = http_get('/')
            print('Server responded, proceeding with smoke tests')
            break
        except Exception as e:
            print('  not ready yet, retrying...', i)
            time.sleep(1)
    else:
        print('Server did not start in time; aborting')
        raise SystemExit(2)

    # 1) Create a test item
    print('\n1) POST /test/create_item/')
    status, body, resp = http_post('/test/create_item/', {'item_type':'pdf','title':'Smoke Item','price':1.0,'file_url':'http://example.com/smoke.pdf'})
    print(' status=', status)
    print(' body=', body)

    # 2) Request a token for user id 6 (adjust if needed)
    print('\n2) POST /token/ (mint token for user id 6)')
    status, body, resp = http_post('/token/', {'userId': 6})
    print(' status=', status)
    print(' body=', body)
    token = None
    try:
        data = json.loads(body)
        token = data.get('token')
    except Exception:
        pass

    # 3) If token available, make a purchase using /purchase/
    if token:
        print('\n3) POST /purchase/ with Authorization token (purchase item id 2)')
        headers = {'Authorization': f'Bearer {token}'}
        # find an item id to buy; try id=2 then id=1
        for item_id in [2,1]:
            status, body, resp = http_post('/purchase/', {'itemId': item_id}, headers=headers)
            print(' tried item_id=', item_id, ' status=', status)
            print(' body=', body)
            if status == 200:
                break

    # 4) GET user profile
    print('\n4) GET /user/6/profile/')
    status, body, resp = http_get('/user/6/profile/')
    print(' status=', status)
    print(' body=', body)

    # 5) GET questions
    print('\n5) GET /api/get-questions/?company=google&difficulty=easy')
    status, body, resp = http_get('/api/get-questions/?company=google&difficulty=easy')
    print(' status=', status)
    print(' body=', body)

    print('\nSmoke tests completed')
