# N3Unit

> TODO find better name

## installation

```
first have EYE and Python installed
npm install
node gather.js
```

## run

`./bin/validate -i [inputfile] -o outputfile -s [comma-delimited schemas, e.g. 'skos,foaf']`

> the prefices of the schemas are saved locally at `resources/ontologies/prefix.json`.
> If a prefix isn't found, you can also enter the full URI
> If you add no schemas, N3Unit will look for all included schemas (best effort)

## docker

Docker does the installation for you, so you only need to do

```
docker build -t n3unit .
docker run n3unit -it -i test/test.ttl -o test.ttl -s foaf
```

> There's a test file at `test/test.ttl`