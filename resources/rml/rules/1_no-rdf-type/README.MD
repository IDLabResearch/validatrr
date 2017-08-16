#Fix?

whenever we have an rr:subjectMap there “should” be an rr:class.

OR

there should be an rr:termType rr:IRI with the template at the basis IRI

OR 

there should be a rr:predicateObjectMap whose rr:predicate is rdf:type


> Note: it’s not mandatory but it’s a good practice (could be Warning instead of Error)

> Note: not for every rr:template because you may have rr:template in a  predicate map or in an object map and it can resolve to a string at the end