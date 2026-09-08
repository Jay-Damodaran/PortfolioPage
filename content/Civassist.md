---
title: "Civassist"
type: project
start: 2026-06                      
end: present                        
---

Civassist is a Civic Tech Project, featuring an SLM powered web app that helps struggling Texans access social services pertaining to healthcare and nutrition (currently focuses on Medicaid, SNAP, WIC, and CHIP). 
- Locally hosted so all data is kept private and doesn't leave the user's device
- **Grounded** by official HHS documents, mitigating model hallucinations
- Deterministic Eligibility Screening through json-schema constrained generation and rules checking script
- Implemented **Guardrail Engineering** techniques like structured outputs, logging, and risk monitoring monitoring metrics
- Implemented **Context Engineering** techniques like RAG and llama-index based Memory Class to bound conversational context size, rolling older turns into terse facts that use fewer tokens 
- Supports document upload, including images, for user convenience and faster screening
