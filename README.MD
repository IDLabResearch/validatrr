# N3Unit

> TODO find better name

## installation

```
first have EYE and Python installed
npm install
node gather.js
```

## run

`./bin/validate_owl -i [inputfile] -o outputfile -s [comma-delimited schemas, e.g. 'skos,foaf'] --ram [amount of RAM, e.g. 2g, 512m] -r [reasoning profile, rdfs and/or owl]`

`--ram` and `-r` are optional.

> the prefices of the schemas are saved locally at `resources/ontologies/prefix.json`.
> If a prefix isn't found, you can also enter the full URI
> If you add no schemas, N3Unit will look for all included schemas (best effort)

## test

`npm test`

The testing goes as follows:
 
1. gather all rule files (see `gather.js`)
    1. take extra files `rdfsResource` and `rdfsSubClassOf`
    2. take all rule files under `resources/rules/*/rule.n3`
    3. combine them in a pvm under `dist/n3unit.pvm`
2. for every profile (in this case only `owl`)
    1. take the testing ontology file (in this case `test/owl/ontology.ttl`)
    2. for every test file (in this case `test/owl/*Correct-Wrong*.ttl`)
        1. run the validation with the pvm, the ontology, the test file, and the profile (in this case `profiles/owl.n3`)
        2. put the ttl output in `tmp/tmp-CONSTRAINT.n3`
        3. put the stderr output in `tmp/tmp-CONSTRAINT_err.n3`
        4. check: if it should be correct, you should receive 0 violations, and otherwise you should receive more than 0

## docker

Docker does the installation for you, so you only need to do

```
docker build -t n3unit .
docker run n3unit -it -i test/test.ttl -o test.ttl -s foaf
```

> There's a test file at `test/test.ttl`