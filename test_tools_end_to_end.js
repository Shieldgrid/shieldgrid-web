import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import OpenAI from 'openai';

async function test() {
  const transport = new SSEClientTransport(new URL('http://localhost:3001/sse'));
  const client = new Client({ name: 'test', version: '1.0.0' }, { capabilities: {} });
  await client.connect(transport);
  console.log("Connected to MCP server.");

  const toolsList = await client.listTools();
  const tools = toolsList.tools.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
    }
  }));

  console.log("Tools fetched: " + tools.length);

  const openai = new OpenAI({
    baseURL: 'https://api.ai.camer.digital/v1',
    apiKey: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6ImZ3ZzlwdGkwczVkaDJwa256NG83ZmIycSJ9.eyJpc3MiOiJodHRwczovL2F1dGguYWkuY2FtZXIuZGlnaXRhbCIsInN1YiI6IjlhOTlhY2JkLTI4NWMtNDIwYy1hZmIyLTk3NTAxZmM4NDFkMyIsImp0aSI6ImxnYnI6ZzE0ZndyZThzYnQ3ZjNkNGxkMTF6Y2loIiwiaWF0IjoxNzg1NDkzMTQ1LCJleHAiOjE3OTU4NjExNDUsInR5cCI6IkJlYXJlciIsImF1ZCI6ImxpZ2h0YnJpZGdlLWFwaS1rZXkiLCJhenAiOiJsaWdodGJyaWRnZS1hcGkta2V5Iiwic2lkIjoiYzd4bmt2em90ZGkzandxOXhkYnRreGs4Iiwic2NvcGUiOiJwcm9maWxlIGVtYWlsIiwiYXBpX2tleV9pZCI6InExM280bnBiMjJzeWpnMXAwYmM4Y2JreCIsInByb2plY3RfaWQiOiJhczRmcTRsazhwcXlwcXVtNGZnd20yZWMiLCJhY2NvdW50X2lkIjoiOWE5OWFjYmQtMjg1Yy00MjBjLWFmYjItOTc1MDFmYzg0MWQzIiwiZW1haWwiOiJqdS1uaW5lLm5ndUBhZG9yc3lzLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlfQ.k2JUFwoV0_kAs2Eq1q-I7LQDjKLrHiccoacKBPNSQILTkB97yFRrcPkaE26HVrElfYQVV0KJCjukoPo1-sLg64P03PsVcbtp0dr0T0iYyCFMF8G_XSVhnp0Zo9dCwSEf5L8ugbR2S5F3VT1mMdhiilLfeGPhQdhIel1CwB4n3oXynWp-dEzMaSlwajX63RTbrOudl6TsjSqsYtz0XBnqOW51Pk5eb7POwB52V6Q_Vm9fCmxBHXxVYeoUnGG4wMhWu3ytvCe3rCJgGYjvUqFzit4-lrMiFnGIyBRjVbDsg5PqNIojgKL7aaSnn8xqnJSC7r29QaJRJbRf3SnIERZkaQ'
  });

  let currentMessages = [{ role: 'user', content: "Can you check our connector health?" }];

  console.log("Sending chat completions...");
  try {
    const response = await openai.chat.completions.create({
      model: 'claude-sonnet-5',
      messages: currentMessages,
      tools: tools
    });

    const msg = response.choices[0].message;
    console.log("AI returned:", msg);
    
    if (msg.tool_calls) {
      for (const tc of msg.tool_calls) {
        console.log("Tool call:", tc);
        const args = JSON.parse(tc.function.arguments || "{}");
        const result = await client.callTool({
          name: tc.function.name,
          arguments: args
        });
        console.log("Tool result:", JSON.stringify(result));
      }
    }
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
test();
