#!/bin/bash

docker run -d --name testdb \
    -p 5401:5432 \
    -e POSTGRES_USER=testappuser \
    -e POSTGRES_PASSWORD=testapppassword \
    postgres:12-alpine

#docker run -d --name testdb -p 5401:5432 -e POSTGRES_USER=testappuser -e POSTGRES_PASSWORD=testapppassword postgres:12-alpine
