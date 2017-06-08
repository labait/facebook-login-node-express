#redboats
a project to allow people to gain access to an event by connecting with fb
based on http://wp.me/p4ISPV-7w

##Environments

###development
http://localhost:3000

###production

http://redboats.herokuapp.com/
to update app in production
```
git push heroku master
```
and cross the figners... :-)

##how to run
### 1st time
* git clone the project
* npm i -g gulp
* npm i
* configure settings in config.js
* set your api keys in .env

### every time
* npm i
* gulp


## mongodb commands

### export registered users to .csv
```
mongoexport -h ds163711.mlab.com:63711 -d heroku_1x2n4nwf -u heroku_1x2n4nwf -p ckpdo4tpl288gvcka6bto5nn4a -c users --type csv --fields fbid,first_name,last_name,email,image_url --out users.csv
```


### import codes from .csv
```
mongoimport -h ds163711.mlab.com:63711 -d heroku_1x2n4nwf -u heroku_1x2n4nwf -p ckpdo4tpl288gvcka6bto5nn4a -c codes --type csv --file codes.csv --headerline
```
ATTENTION! this is done on production env


### dump db from production to local
```
mongodump -h ds163711.mlab.com:63711 -d heroku_1x2n4nwf -u heroku_1x2n4nwf -p ckpdo4tpl288gvcka6bto5nn4a -o $HOME/Desktop/redboats
```

### restore dump to local db
```
mongorestore -d redboats $HOME/Desktop/redboats/heroku_1x2n4nwf/
```

# references
* aws s3 upload http://www.joshsgman.com/upload-to-and-get-images-from-amazon-s3-with-node-js/
