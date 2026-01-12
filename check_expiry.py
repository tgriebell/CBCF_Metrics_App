import datetime

timestamp = 1766412000
dt_object = datetime.datetime.fromtimestamp(timestamp)

print(f"Timestamp: {timestamp}")
print(f"Data de expiração: {dt_object}")

import time
now = time.time()
print(f"Agora: {now}")

if now > timestamp:
    print("O LINK EXPIROU!")
else:
    print("O link ainda deveria ser válido.")
