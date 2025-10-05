"""
Rules manager for system prompt generation and workspace constraints.
"""
from typing import Dict, Any, Optional
from db import get_supabase


def get_rules(workspace_id: str) -> Dict[str, Any]:
    """
    Get rules for a specific workspace.
    
    Args:
        workspace_id: Unique identifier for the workspace
        
    Returns:
        Dictionary containing rules (tone, style, constraints, etc.)
    """
    try:
        supabase = get_supabase()
        result = supabase.table("rules").select("content").eq("workspace_id", workspace_id).execute()
        
        if result.data:
            return result.data[0]["content"]
        else:
            return {}
    except Exception as e:
        print(f"Error fetching rules for workspace {workspace_id}: {e}")
        return {}


def build_system_prompt(rules: Dict[str, Any]) -> str:
    """
    Build system prompt from rules.
    
    Args:
        rules: Rules dictionary containing tone, style, constraints, etc.
        
    Returns:
        Formatted system prompt string
    """
    if not rules:
        return "You are a helpful assistant."
    
    tone = rules.get("tone", "neutral")
    style = rules.get("style", "general")
    constraints = rules.get("constraints", "")
    domain = rules.get("domain", "")
    personality = rules.get("personality", "")
    
    prompt_parts = ["You are a helpful assistant."]
    
    if personality:
        prompt_parts.append(f"Personality: {personality}")
    
    if tone:
        prompt_parts.append(f"Tone: {tone}")
    
    if style:
        prompt_parts.append(f"Style: {style}")
    
    if domain:
        prompt_parts.append(f"Domain expertise: {domain}")
    
    if constraints:
        prompt_parts.append(f"Constraints: {constraints}")
    
    return "\n".join(prompt_parts)


def update_rules(workspace_id: str, rules: Dict[str, Any]) -> bool:
    """
    Update rules for a workspace.
    
    Args:
        workspace_id: Unique identifier for the workspace
        rules: Rules dictionary to store
        
    Returns:
        True if successful, False otherwise
    """
    try:
        supabase = get_supabase()
        
        # Upsert rules for the workspace
        result = supabase.table("rules").upsert({
            "workspace_id": workspace_id,
            "content": rules
        }).execute()
        
        return True
    except Exception as e:
        print(f"Error updating rules for workspace {workspace_id}: {e}")
        return False


def get_default_rules() -> Dict[str, Any]:
    """
    Get default rules template.
    
    Returns:
        Dictionary with default rule structure
    """
    return {
        "tone": "professional",
        "style": "clear and concise",
        "constraints": "Be accurate and helpful",
        "domain": "general",
        "personality": "friendly and knowledgeable"
    }


def get_hardcoded_rules() -> str:
    """
    Get the hardcoded rules for grant proposal writing.
    
    Returns:
        Hardcoded rules string for the GreenFuture Alliance grant proposal
    """
    return """You are writing a grant proposal for GreenFuture Alliance, an international NGO dedicated to expanding access to renewable energy in underserved rural regions. The goal of this proposal is to secure funding from the Global Energy Impact Fund for a new solar microgrid initiative in Sub-Saharan Africa.

The proposal must emphasize measurable impact, community engagement, and sustainability. It should clearly explain how the project will reduce carbon emissions, empower local communities through job creation, and maintain long-term operation without dependency on foreign aid.

Guidelines:
	•	Length: 500–700 words total.
	•	Tone: Professional, persuasive, and impact-driven.
	•	Structure:
	1.	Executive Summary (goal, region, funding requested).
	2.	Project Rationale (problem + opportunity).
	3.	Implementation Plan (timeline, partners, community involvement).
	4.	Expected Impact (social, economic, environmental outcomes).
	5.	Budget Overview (transparent allocation).
	•	Formatting: Write in plain, concise English suitable for global reviewers; avoid jargon.
	•	Citations: Include data sources or prior project outcomes when possible.
	•	Focus: Demonstrate scalability and local empowerment rather than technological complexity.

Follow these rules strictly when generating the proposal or providing edits or feedback."""
