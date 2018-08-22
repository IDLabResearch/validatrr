#Problem?

transit:route correctly mapped to xsd:int 

but data extract is of xsd:double

add rml:process

#Fix?

This cannot be checked at the mapping document level only., it needs an extraction sample.
In theory it will produce invalid RDF (“3.45”^^xsd:int will be rejected by strict parsers)

&rightarrow; not possible via rules
