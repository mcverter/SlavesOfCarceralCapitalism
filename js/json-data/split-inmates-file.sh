#!/bin/bash

split -d -l 2000 April22AllInmates.json "inmates"


for f in `ls`
do
    if [[ "$f" =~ ^inmate* ]] && ! [[ "$f" =~ .js$ ]]
    then
        startfile="let $f = function $f(){return["
        endfile="]};Array.prototype.push.apply(window.allInmates, $f());"

        contents=`cat $f`
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

