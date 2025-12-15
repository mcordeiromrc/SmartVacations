import requests

url = 'http://localhost:8000/employees/import'
files = {'file': open('temp_migration.csv', 'rb')}

try:
    r = requests.post(url, files=files)
    print(r.status_code)
    print(r.json())
except Exception as e:
    print(e)
