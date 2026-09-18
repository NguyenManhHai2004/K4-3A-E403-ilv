from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any

from providers.base import Provider, ToolCall
from tools import TOOL_FUNCTIONS


@dataclass
class AgentRun:
    text: str | None
    tool_calls: list[ToolCall] = field(default_factory=list)
    tool_results: list[dict[str, Any]] = field(default_factory=list)


class Agent:
    def __init__(
        self,
        provider: Provider,
        *,
        system_prompt: str,
        tools: list[dict[str, Any]] | None = None,
        model: str | None = 'gpt-4o-mini',
    ) -> None:
        self.provider = provider
        self.system_prompt = system_prompt
        self.tools = tools or []
        self.model = model

    def run(self, user_messages: list[dict[str, str]], *, tool_choice: Any | None = None) -> AgentRun:
        messages = [{"role": "system", "content": self.system_prompt}, *user_messages]
        response = self.provider.complete(
            messages,
            self.tools,
            model=self.model,
            temperature=0.0,
            tool_choice=tool_choice,
        )
        results: list[dict[str, Any]] = []
        for call in response.tool_calls:
            func = TOOL_FUNCTIONS.get(call.name)
            if not func:
                results.append({"tool": call.name, "error": "unknown_tool"})
                continue
            try:
                result = func(**call.args)
            except Exception as exc:  # keep eval robust; failures are evidence
                result = {"error": type(exc).__name__, "message": str(exc)}
            results.append({"tool": call.name, "args": call.args, "result": result})
        return AgentRun(text=response.text, tool_calls=response.tool_calls, tool_results=results)

    def run_loop(
        self,
        user_messages: list[dict[str, str]],
        *,
        max_iterations: int = 6,
        tool_choice: Any | None = None,
    ) -> AgentRun:
        messages = [{"role": "system", "content": self.system_prompt}, *user_messages]
        all_tool_calls: list[ToolCall] = []
        all_tool_results: list[dict[str, Any]] = []
        final_text: str | None = None

        for iteration in range(max_iterations):
            current_choice = tool_choice if iteration == 0 else None
            response = self.provider.complete(
                messages,
                self.tools,
                model=self.model,
                temperature=0.0,
                tool_choice=current_choice,
            )

            if not response.tool_calls:
                final_text = response.text
                break

            iteration_results: list[dict[str, Any]] = []
            for call in response.tool_calls:
                all_tool_calls.append(call)
                func = TOOL_FUNCTIONS.get(call.name)
                if not func:
                    res = {"tool": call.name, "error": "unknown_tool"}
                else:
                    try:
                        res = func(**call.args)
                    except Exception as exc:
                        res = {"error": type(exc).__name__, "message": str(exc)}
                entry = {"tool": call.name, "args": call.args, "result": res}
                iteration_results.append(entry)
                all_tool_results.append(entry)

            assistant_content = response.text or f"Thought: Gọi tool {', '.join(c.name for c in response.tool_calls)} để tạo học liệu."
            messages.append({"role": "assistant", "content": assistant_content})

            obs_json = json.dumps(iteration_results, ensure_ascii=False, indent=2)
            obs_content = (
                f"Observation:\n{obs_json}\n\n"
                "Kiểm tra xem đã tạo đủ tất cả các loại học liệu người dùng yêu cầu chưa.\n"
                "- Nếu chưa đủ: Hãy đưa ra Thought và gọi tool tiếp theo để tạo học liệu còn thiếu.\n"
                "- Nếu đã đủ: Hãy trả lời kết quả cuối cùng theo response contract JSON (không gọi thêm tool)."
            )
            messages.append({"role": "user", "content": obs_content})

        if not final_text and all_tool_results:
            try:
                final_resp = self.provider.complete(
                    messages,
                    tools=None,
                    model=self.model,
                    temperature=0.0,
                )
                final_text = final_resp.text
            except Exception:
                pass

        return AgentRun(text=final_text, tool_calls=all_tool_calls, tool_results=all_tool_results)

