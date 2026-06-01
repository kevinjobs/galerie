"use client";
import { useEffect, useState } from "react";

interface OpenApiSpec {
  info: { title: string; description: string; version: string };
  paths: Record<string, Record<string, any>>;
  components?: { schemas?: Record<string, any> };
}

const methodStyles: Record<string, string> = {
  get: "bg-green-600 text-white",
  post: "bg-blue-600 text-white",
  put: "bg-amber-500 text-white",
  delete: "bg-red-600 text-white",
};

const authLabels: Record<string, string> = {
  BearerAuth: "JWT",
  ApiTokenAuth: "API Token",
};

export default function DocsPage() {
  const [spec, setSpec] = useState<OpenApiSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/docs")
      .then((r) => r.json())
      .then((data) => { setSpec(data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
  if (error) return <div className="text-red-500 text-center p-8">加载失败: {error}</div>;
  if (!spec) return null;

  const paths = Object.entries(spec.paths);
  const tags = [...new Set(paths.flatMap(([, methods]) => Object.values(methods).map((m: any) => m.tags?.[0]).filter(Boolean)))];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{spec.info.title} API</h1>
        <p className="text-gray-400 mb-1">{spec.info.description}</p>
        <p className="text-xs text-gray-500">Version: {spec.info.version} &middot; Base URL: <code className="text-blue-400">/api</code></p>
      </header>

      <section className="mb-8 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">认证方式</h2>
        <div className="space-y-2">
          <div>
            <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-blue-600 text-white mr-2">JWT</span>
            Bearer Token &mdash; 登录后获得，存储在 <code className="text-blue-400 text-sm">localStorage(&apos;token&apos;)</code>
          </div>
          <div>
            <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-purple-600 text-white mr-2">API Token</span>
            通过 <code className="text-blue-400 text-sm">POST /api/user/token</code> 创建，适用于 AI 客户端
          </div>
        </div>
      </section>

      {tags.map((tag) => (
        <section key={tag} className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">{tag}</h2>
          {paths
            .flatMap(([path, methods]) => Object.entries(methods).map(([method, detail]: [string, any]) => ({ path, method, detail, tag: detail.tags?.[0] })))
            .filter((e) => e.tag === tag)
            .map(({ path, method, detail }) => (
              <div key={`${method}-${path}`} className="mb-4 p-4 bg-gray-800/80 rounded-lg border border-gray-700 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className={`shrink-0 px-2 py-1 rounded text-xs font-mono font-bold uppercase ${methodStyles[method] || "bg-gray-500 text-white"}`}>
                    {method}
                  </span>
                  <div className="flex-1 min-w-0">
                    <code className="text-sm font-mono text-blue-400 break-all">/api{path}</code>
                    <h3 className="font-medium mt-1">{detail.summary}</h3>
                    <p className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">{detail.description}</p>

                    {detail.security && (
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {detail.security.flatMap((s: any) => Object.keys(s)).map((auth: string) => (
                          <span key={auth} className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${auth === "BearerAuth" ? "bg-blue-600/20 text-blue-300" : "bg-purple-600/20 text-purple-300"}`}>
                            {authLabels[auth] || auth}
                          </span>
                        ))}
                      </div>
                    )}

                    {detail.parameters?.length > 0 && (
                      <details className="mt-3">
                        <summary className="text-xs cursor-pointer text-gray-400 hover:text-gray-200">参数 ({detail.parameters.length})</summary>
                        <table className="w-full mt-2 text-xs border border-gray-700 rounded-lg overflow-hidden">
                          <thead>
                            <tr className="bg-gray-800">
                              <th className="p-2 text-left font-medium">名称</th>
                              <th className="p-2 text-left font-medium">位置</th>
                              <th className="p-2 text-left font-medium">类型</th>
                              <th className="p-2 text-left font-medium">必需</th>
                              <th className="p-2 text-left font-medium">说明</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.parameters.map((p: any) => (
                              <tr key={p.name} className="border-t border-gray-700">
                                <td className="p-2 font-mono">{p.name}</td>
                                <td className="p-2">{p.in}</td>
                                <td className="p-2">{p.schema?.type || "-"}</td>
                                <td className="p-2">{p.required ? "是" : "否"}</td>
                                <td className="p-2">{p.description || p.schema?.description || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </details>
                    )}

                    {detail.requestBody && (
                      <details className="mt-3">
                        <summary className="text-xs cursor-pointer text-gray-400 hover:text-gray-200">请求体</summary>
                        <pre className="mt-2 p-3 bg-gray-900 rounded-lg text-xs overflow-x-auto font-mono">
                          {JSON.stringify(detail.requestBody?.content?.["application/json"]?.schema || detail.requestBody?.content?.["multipart/form-data"]?.schema || {}, null, 2)}
                        </pre>
                        {detail.requestBody?.content?.["application/json"]?.example && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-400 mb-1">示例:</p>
                            <pre className="p-3 bg-gray-900 rounded-lg text-xs overflow-x-auto font-mono">
                              {JSON.stringify(detail.requestBody.content["application/json"].example, null, 2)}
                            </pre>
                          </div>
                        )}
                      </details>
                    )}

                    <details className="mt-3">
                      <summary className="text-xs cursor-pointer text-gray-400 hover:text-gray-200">响应</summary>
                      {Object.entries(detail.responses || {}).map(([code, resp]: [string, any]) => (
                        <div key={code} className="mt-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${code.startsWith("2") ? "bg-green-600/20 text-green-300" : code.startsWith("4") ? "bg-amber-600/20 text-amber-300" : "bg-red-600/20 text-red-300"}`}>
                            {code}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">{resp.description}</span>
                          {resp.content?.["application/json"]?.schema && (
                            <pre className="mt-1 p-2 bg-gray-900 rounded text-xs overflow-x-auto font-mono">
                              {JSON.stringify(resp.content["application/json"].schema, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </details>
                  </div>
                </div>
              </div>
            ))}
        </section>
      ))}

      <hr className="my-8 border-gray-700" />

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">数据模型</h2>
        {spec.components?.schemas && Object.entries(spec.components.schemas).filter(([name]) => name !== "Error").map(([name, schema]: [string, any]) => (
          <div key={name} className="mb-4 p-4 bg-gray-800/80 rounded-lg border border-gray-700 shadow-sm">
            <h3 className="font-bold mb-2">{name}</h3>
            {schema.properties && (
              <table className="w-full text-xs border border-gray-700 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="p-2 text-left font-medium">字段</th>
                    <th className="p-2 text-left font-medium">类型</th>
                    <th className="p-2 text-left font-medium">必需</th>
                    <th className="p-2 text-left font-medium">说明</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(schema.properties).map(([propName, prop]: [string, any]) => (
                    <tr key={propName} className="border-t border-gray-700">
                      <td className="p-2 font-mono">{propName}</td>
                      <td className="p-2">
                        {prop.type}
                        {prop.format ? `(${prop.format})` : ""}
                        {prop.items ? `[${prop.items.type}]` : ""}
                      </td>
                      <td className="p-2">{schema.required?.includes(propName) ? "是" : "否"}</td>
                      <td className="p-2">{prop.description || (prop.nullable === true ? "nullable" : "-")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {schema.enum && <p className="text-xs mt-1 text-gray-400">枚举值: {schema.enum.join(", ")}</p>}
          </div>
        ))}
      </section>

      <footer className="text-center text-xs text-gray-500 py-8">
        Galerie API Documentation &mdash; OpenAPI 3.0.3
      </footer>
    </div>
  );
}
