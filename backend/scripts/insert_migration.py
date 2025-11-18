import sqlite3
import datetime
c = sqlite3.connect('db.sqlite3')
c.execute("INSERT INTO django_migrations(app,name,applied) VALUES(?,?,?)", ('accounts','0001_initial', datetime.datetime.now().isoformat()))
c.commit()
print('inserted accounts migration record')
