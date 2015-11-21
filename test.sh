#/bin/bash

for i in $(ls); do
  if [ "$i" != "test.sh" ] 
  then
    tar -zcvf $i.tar.gz $i
  fi
done

ls -l *.tar.gz
