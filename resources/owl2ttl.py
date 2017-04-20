#!/usr/bin/python
from rdflib import Graph
import sys

g = Graph()
g.parse(sys.argv[1])

print g.serialize(format='turtle')