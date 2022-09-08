# openssl req -newkey rsa:2048 -new -nodes -sha256 -x509 -days 3650 -keyout mycert.key1 -out mycert.crt1 -subj '/CN=snsq' -extensions EXT -config mycert.cnf
read -r -p "regenerate the CA certificate file? Are you sure? [y/N] " response
response=${response,,} # tolower
if [[ $response =~ ^(yes|y) ]]; then
    openssl req -newkey rsa:2048 -new -nodes -sha256 -x509 -days 3650 -keyout mycert.key -out mycert.crt -subj '/CN=snsq' -extensions EXT -config mycert.cnf
else
    printf "Cancel.\n"
fi