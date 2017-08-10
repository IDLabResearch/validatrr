#Problem?

dcterms:publisher is object property but literal is given instead

#Fix?

rr:constant should be taken into account in above cases.

plus a special case where we check :
if rr:constant OR rr:template value is literal (rr:termType rr:Literal) and rr:predicate value has an ObjectPoperty 
then require rr:termType rr:IRI

