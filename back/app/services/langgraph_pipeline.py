from langgraph.graph import StateGraph
from typing import Any, Dict, Callable
from app.services.langgraph_nodes import photo_node, quiz_node, orchestrator_node


def build_analysis_graph(orchestrator: Any, question_map: Dict[str, Any]) -> Any:
    """
    Build and compile the LangGraph pipeline for AI analysis.
    Pass orchestrator and question_map via state for node access.
    """
    def photo_node_with_deps(state: Dict[str, Any]) -> Dict[str, Any]:
        return photo_node(state)

    def quiz_node_with_deps(state: Dict[str, Any]) -> Dict[str, Any]:
        # Inject question_map into state for quiz_node
        state = dict(state)
        state["question_map"] = question_map
        return quiz_node(state)

    def orchestrator_node_with_deps(state: Dict[str, Any]) -> Dict[str, Any]:
        # Inject orchestrator into state for orchestrator_node
        state = dict(state)
        state["orchestrator"] = orchestrator
        return orchestrator_node(state)

    builder = StateGraph(dict)
    builder.add_node("photo", photo_node_with_deps)
    builder.add_node("quiz", quiz_node_with_deps)
    builder.add_node("orchestrator", orchestrator_node_with_deps)
    builder.add_edge("photo", "quiz")
    builder.add_edge("quiz", "orchestrator")
    builder.set_entry_point("photo")
    return builder.compile() 