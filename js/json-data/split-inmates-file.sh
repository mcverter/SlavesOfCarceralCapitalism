#!/bin/bash

split -d -l 2000 April22AllInmates.json "inmates"


for f in `ls`
do
    if [[ "$f" =~ ^inmate* ]] && ! [[ "$f" =~ .js$ ]]
    then
#        startfile="Array.prototype.push.call(window.allInmates,"
#        endfile="]};Array.prototype.push.apply(window.allInmates, $f());"
        endfile=");"
startfile="addInmatesFn = function (){return["
        endfile="]};Array.prototype.push.apply(window.allInmates, addInmatesFn());"

        contents=`cat $f`
        contents=${contents%?};
        if [ -e "$f.js" ]
        then
            rm "$f.js"
        fi
        if [ -e "$f" ]
        then
            rm "$f"
        fi
        echo "$startfile$contents$endfile" > "$f.js"
    fi
done

