#Problem?

predicate is an objectProperty

#Fix?


if it’s an object property, the first one is wrong. 
rml:reference automatically implies that a literal is generated unless rr:termType rr:IRI is specified



In the last case any rr:datatype doesn’t generate a resource (but a Literal), it’s wrong



In the case of constant
rr:constant "stop/whatever" is wrong but 
rr:constant ex:Something is correct


