#!/bin/bash

function dev(){

    node --loader ts-node/esm --no-warnings --experimental-specifier-resolution=node cli/src/index.ts dev

}

eval "$@"