import { useState, useRef, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const agentCards = {
  orchestrator: { name: 'Orchestrator', icon: '🎯' },
  flight: { name: 'Flight Agent', icon: '✈️' },
  weather: { name: 'Weather Agent', icon: '🌤️' },
  support: { name: 'Support Agent', icon: '💬' },
  info: { name: 'Info Agent', icon: '🏢' }
};

export default function App() {
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState('chat');
  const [apiStatus, setApiStatus] = useState('checking');
  const [dbStats, setDbStats] = useState(null);
  const [flights, setFlights] = useState([]);
  const [weather, setWeather] = useState([]);
  const endRef = useRef(null);

  useEffect(() => { 
    endRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  useEffect(() => {
    checkApiHealth();
    loadData();
    setMessages([{
      role: 'assistant',
      content: `🛫 **Xin chào! Tôi là AI Flight Assistant**

Tôi được tích hợp với:
• 🤖 **OpenAI GPT-4** - Xử lý ngôn ngữ tự nhiên
• 🔧 **MCP Tools** - Truy vấn database
• 🔗 **A2A Protocol** - Phối hợp đa agent
• 🗄️ **PostgreSQL** - Lưu trữ dữ liệu

**Thử ngay:**
• VN123 - Chuyến bay đúng giờ
• VN456 - Chuyến bay delay
• QH101 - Chuyến bay bị hủy
• thời tiết Hà Nội - Xem thời tiết`
    }]);
  }, []);

  const checkApiHealth = async () => {
    try {
      const res = await fetch(API_URL + '/api/health');
      const data = await res.json();
      setApiStatus(data.status === 'ok' ? 'connected' : 'error');
    } catch {
      setApiStatus('disconnected');
    }
  };

  const loadData = async () => {
    try {
      const [flightsRes, weatherRes, airportsRes] = await Promise.all([
        fetch(API_URL + '/api/flights').then(r => r.json()),
        fetch(API_URL + '/api/weather').then(r => r.json()),
        fetch(API_URL + '/api/airports').then(r => r.json())
      ]);
      setFlights(flightsRes);
      setWeather(weatherRes);
      setDbStats({ 
        flights: flightsRes.length, 
        airports: airportsRes.length, 
        weather: weatherRes.length 
      });
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  };

  const sendMessage = async (text) => {
    setIsProcessing(true);
    setLogs([]);

    try {
      const res = await fetch(API_URL + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history })
      });

      const data = await res.json();

      if (data.success) {
        setLogs(data.logs || []);
        const newHistory = [
          ...history,
          { role: 'user', content: text },
          { role: 'assistant', content: data.response }
        ];
        setHistory(newHistory);
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        throw new Error(data.error || 'API error');
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ **Lỗi:** ' + error.message + '\n\nVui lòng kiểm tra backend server và OpenAI API key.'
      }]);
    }

    setIsProcessing(false);
  };

  const submit = () => {
    if (!input.trim() || isProcessing) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    sendMessage(input);
    setInput('');
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: '🔄 Đã xóa lịch sử chat. Hãy bắt đầu cuộc trò chuyện mới!' }]);
    setHistory([]);
    setLogs([]);
  };

  const LogItem = ({ log }) => {
    const agent = agentCards[log.agent] || { name: log.agent, icon: '⚙️' };
    const typeStyles = {
      request: 'border-l-gray-400 bg-gray-50',
      a2a: 'border-l-purple-500 bg-purple-50',
      mcp: 'border-l-blue-500 bg-blue-50',
      llm: 'border-l-amber-500 bg-amber-50',
      success: 'border-l-green-500 bg-green-50',
      error: 'border-l-red-500 bg-red-50',
      complete: 'border-l-green-600 bg-green-100'
    };
    const typeLabels = { a2a: 'A2A', mcp: 'MCP', llm: 'LLM' };

    return (
      <div className={'border-l-4 pl-2 py-1.5 rounded-r text-xs ' + (typeStyles[log.type] || 'border-l-gray-300')}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-base">{agent.icon}</span>
          <span className="font-semibold text-gray-700">{agent.name}</span>
          {typeLabels[log.type] && (
            <span className={'px-1.5 py-0.5 rounded text-[10px] font-bold ' + 
              (log.type === 'a2a' ? 'bg-purple-200 text-purple-800' :
               log.type === 'mcp' ? 'bg-blue-200 text-blue-800' :
               'bg-amber-200 text-amber-800')
            }>{typeLabels[log.type]}</span>
          )}
        </div>
        <div className="text-gray-600 mt-0.5 break-words">
          <span className="font-medium">{log.action}:</span> {log.details}
        </div>
      </div>
    );
  };

  const statusColors = {
    'On Time': 'bg-green-100 text-green-800',
    'Delayed': 'bg-yellow-100 text-yellow-800',
    'Cancelled': 'bg-red-100 text-red-800',
    'Boarding': 'bg-blue-100 text-blue-800'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-2 md:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2">
            <span className="text-3xl">🛫</span>
            <h1 className="text-xl md:text-2xl font-bold text-white">AI Flight Assistant</h1>
            <span className="text-2xl">✨</span>
          </div>
          <div className="flex items-center justify-center gap-3 mt-2 text-xs flex-wrap">
            <span className={'flex items-center gap-1 px-2 py-1 rounded-full ' + 
              (apiStatus === 'connected' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300')
            }>
              🔌 API: {apiStatus}
            </span>
            {dbStats && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
                🗄️ {dbStats.flights} flights | {dbStats.airports} airports
              </span>
            )}
            <button onClick={() => { checkApiHealth(); loadData(); }} className="p-1 hover:bg-white/10 rounded text-white">
              🔄
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 justify-center flex-wrap">
          {[
            { id: 'chat', icon: '💬', label: 'Chat' },
            { id: 'flights', icon: '✈️', label: 'Flights' },
            { id: 'weather', icon: '🌤️', label: 'Weather' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={'px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ' +
                (tab === t.id ? 'bg-blue-500 text-white' : 'bg-white/10 text-blue-200 hover:bg-white/20')
              }
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'chat' ? (
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Chat Panel */}
            <div className="bg-white rounded-xl shadow-xl flex flex-col h-[500px] md:h-[550px]">
              <div className="p-3 border-b bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-xl flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-white flex items-center gap-2">
                    💬 Chat with AI
                  </h2>
                  <p className="text-blue-100 text-xs">GPT-4 + MCP Tools + PostgreSQL</p>
                </div>
                <button onClick={clearChat} className="text-white/70 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10">
                  Clear
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={'flex ' + (msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div className={'max-w-[85%] rounded-xl p-3 ' +
                      (msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800')
                    }>
                      <pre className="whitespace-pre-wrap font-sans text-sm">{msg.content}</pre>
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-xl p-3 flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      <span className="text-sm text-gray-600">Đang xử lý...</span>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submit()}
                    placeholder="Nhập tin nhắn... (VN123, thời tiết HAN, ...)"
                    className="flex-1 px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={isProcessing || apiStatus !== 'connected'}
                  />
                  <button
                    onClick={submit}
                    disabled={isProcessing || !input.trim() || apiStatus !== 'connected'}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    📤
                  </button>
                </div>
              </div>
            </div>

            {/* Logs Panel */}
            <div className="bg-white rounded-xl shadow-xl flex flex-col h-[500px] md:h-[550px]">
              <div className="p-3 border-b bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-xl">
                <h2 className="font-bold text-white flex items-center gap-2">
                  🤖 Agent Activity Logs
                </h2>
                <p className="text-purple-100 text-xs">Real-time: LLM → A2A → MCP → Database</p>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {logs.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <span className="text-4xl block mb-2">🤖</span>
                    <p className="text-sm">Gửi tin nhắn để xem agent hoạt động</p>
                  </div>
                ) : (
                  logs.map((log, i) => <LogItem key={i} log={log} />)
                )}
              </div>

              <div className="p-2 border-t bg-gray-50 rounded-b-xl">
                <div className="flex gap-4 text-xs justify-center">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-400 rounded"></span> LLM</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-purple-400 rounded"></span> A2A</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-400 rounded"></span> MCP</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-green-400 rounded"></span> Success</span>
                </div>
              </div>
            </div>
          </div>
        ) : tab === 'flights' ? (
          <div className="bg-white rounded-xl p-4 shadow-xl overflow-x-auto">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              ✈️ Flight Database ({flights.length} records)
            </h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left rounded-tl-lg">Code</th>
                  <th className="p-2 text-left">Airline</th>
                  <th className="p-2 text-left">Route</th>
                  <th className="p-2 text-left">Time</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Gate</th>
                  <th className="p-2 text-right rounded-tr-lg">Price</th>
                </tr>
              </thead>
              <tbody>
                {flights.map((f, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50 transition">
                    <td className="p-2 font-mono font-semibold">{f.flight_code}</td>
                    <td className="p-2">{f.airline}</td>
                    <td className="p-2">{f.from_airport} → {f.to_airport}</td>
                    <td className="p-2 font-mono">{f.departure_time?.slice(0,5)} - {f.arrival_time?.slice(0,5)}</td>
                    <td className="p-2">
                      <span className={'px-2 py-0.5 rounded-full text-xs font-medium ' + (statusColors[f.status] || 'bg-gray-100')}>
                        {f.status}
                      </span>
                      {f.delay_minutes > 0 && <span className="text-xs text-gray-500 ml-1">(+{f.delay_minutes}m)</span>}
                    </td>
                    <td className="p-2">{f.gate || '-'}</td>
                    <td className="p-2 text-right font-mono">{f.price?.toLocaleString()}đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-4 shadow-xl">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              🌤️ Weather Data ({weather.length} airports)
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {weather.map((w, i) => (
                <div key={i} className="border rounded-xl p-4 hover:shadow-lg transition bg-gradient-to-br from-blue-50 to-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{w.airport_code}</div>
                      <div className="text-sm text-gray-500">{w.city}</div>
                    </div>
                    <div className="text-4xl font-light text-gray-700">{w.temperature}°C</div>
                  </div>
                  <div className="mt-3 text-gray-600">{w.condition}</div>
                  <div className="mt-2 flex gap-3 text-sm text-gray-500">
                    <span>💨 {w.wind_speed}</span>
                    <span>💧 {w.humidity}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-blue-300 text-xs">
          Built with React + Express + PostgreSQL + OpenAI | MCP + A2A Demo
        </div>
      </div>
    </div>
  );
}