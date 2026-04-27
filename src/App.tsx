/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Network, 
  Play, 
  Brain, 
  Wrench, 
  Cpu, 
  ChevronRight,
  ChevronDown,
  Activity,
  Box,
  Save,
  RotateCcw,
  BarChart3,
  Server,
  CheckCircle2,
  Zap,
  Layers,
  TerminalSquare,
  GlobeLock,
  Languages,
  DatabaseZap
} from 'lucide-react';

// --- Utils ---
const getBeijingTime = () => {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date());
};

const MOCK_SYSTEMS = ['CodeAct (GPT-4o)', 'MLab v1 (Claude-3)', 'MLab v2 (Llama-3)', 'Aide'];

// --- Types ---
interface Message {
  role: 'user' | 'agent';
  content: string;
  type?: 'trajectory';
  thought?: string;
  action?: string;
  actionInput?: string;
  observation?: string;
  isError?: boolean;
}

interface LogEntry {
  time: string;
  text: string;
}

interface MemoryNode {
  id?: string;
  content: string;
  type: 'Task' | 'Thought' | 'Action' | 'Observation';
  status: 'success' | 'error' | 'idle';
  children: MemoryNode[];
  isSnapshot?: boolean;
}

// --- Components ---

// 1. Sidebar Component
const Sidebar = ({ activeTab, setActiveTab, lang, setLang, t }: any) => {
  const navItems = [
    { id: 'chat', icon: MessageSquare, label: t('工作空间', 'Workspace') },
    { id: 'memory', icon: Network, label: t('记忆回溯', 'Memory Tree') },
    { id: 'env', icon: TerminalSquare, label: t('环境调度', 'Environment') },
    { id: 'status', icon: BarChart3, label: t('量化评估', 'Benchmark') },
  ];

  return (
    <div className="w-64 bg-[#050814]/90 backdrop-blur-2xl border-r border-cyan-900/30 flex flex-col h-full text-slate-300 relative z-20 shadow-[8px_0_30px_rgba(6,182,212,0.1)]">
      <div className="p-6 flex items-center justify-between border-b border-cyan-900/30 bg-gradient-to-b from-cyan-950/20 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0a192f] rounded-xl border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Box className="text-cyan-400" size={22} />
          </div>
          <h1 className="text-2xl font-black tracking-widest bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 text-transparent bg-clip-text drop-shadow-sm">
            iGYM
          </h1>
        </div>
        <button 
          onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
          className="flex items-center justify-center p-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-900/80 text-cyan-400 border border-slate-700 hover:border-cyan-500/50 transition-all shadow-inner"
          title="Toggle Language"
        >
          <Languages size={14} />
          <span className="ml-1 text-[10px] font-bold">{lang === 'zh' ? 'EN' : '中'}</span>
        </button>
      </div>
      <nav className="flex-1 p-5 space-y-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 relative overflow-hidden ${
                isActive 
                  ? 'bg-[#0c1e3e]/80 text-cyan-300 font-bold border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.2)]' 
                  : 'hover:bg-[#0f172a] hover:text-slate-100 border border-transparent'
              }`}
            >
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>}
              <Icon size={20} className={isActive ? 'animate-pulse text-cyan-400' : 'text-slate-500'} />
              <span className="text-sm tracking-widest uppercase">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-6 border-t border-cyan-900/30 bg-[#020617]/80">
        <div className="flex items-center gap-3 text-xs text-emerald-400 mb-3 font-mono tracking-wide">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)] animate-ping"></div>
          {t('Ray 集群在线 (4节点)', 'Ray Cluster (4 Nodes)')}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 font-mono tracking-wide">
          <GlobeLock size={14} className="text-cyan-600" />
          <span>v1.0.0-rc.3 • Secured</span>
        </div>
      </div>
    </div>
  );
};

// 2. Chat/Workspace Component
const WorkspaceTab = ({ messages, setMessages, addLog, appendMemory, onSaveSnapshot, onRestoreSnapshot, t }: any) => {
  const [isTyping, setIsTyping] = useState(false);
  const [typingStatus, setTypingStatus] = useState('');
  const [inputValue, setInputValue] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping, typingStatus]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const userText = inputValue;
    
    setMessages((prev: Message[]) => [...prev, { role: 'user', content: userText }]);
    setInputValue('');
    setIsTyping(true);
    
    addLog(`[Dispatcher] Intercepted Signal: "${userText.substring(0, 20)}..."`);
    addLog(`[Agent] CodeAct framework engaged. Analyzing latent space...`);

    if (userText.toLowerCase().includes('kaggle') || userText.includes('比赛')) {
      setTypingStatus(t('解析 Kaggle 比赛要求与数据结构...', 'Analyzing Kaggle competition specs & data...'));
      
      setTimeout(() => {
        setTypingStatus(t('连接 Kaggle API 并挂载数据集...', 'Connecting Kaggle API & mounting data...'));
        addLog("[Sys] Kaggle API token authenticated. Initiating data pull...");
        const msg1: Message = { 
          role: 'agent', type: 'trajectory', 
          thought: t('为了完成 Kaggle 泰坦尼克号预测任务，我需要先通过 API 下载并解压数据集。', 'To complete the Kaggle Titanic task, I need to download and unzip the dataset via API.'), 
          action: 'execute_bash', 
          actionInput: 'kaggle competitions download -c titanic\nunzip titanic.zip -d ./data', 
          observation: 'Downloading titanic.zip to ./data\n100%|██████████| 34.1K/34.1K [00:00<00:00, 1.22MB/s]\nArchive:  titanic.zip\n  inflating: train.csv\n  inflating: test.csv', 
          content: t('数据集已成功下载并解压到沙盒目录。', 'Dataset successfully downloaded and extracted.') 
        };
        setMessages((prev: Message[]) => [...prev, msg1]);
        appendMemory(userText + " (Step 1)", msg1);
        addLog(`[ThreadExecutor] executed bash. Exit code: 0.`);
      }, 5000);

      setTimeout(() => {
        setTypingStatus(t('启动 Jupyter 内核，扫描缺失值与特征分布...', 'Starting Jupyter kernel, scanning missing values & distributions...'));
        addLog("[JupyterKernel] Kernel python3 started. Memory allocated: 2GB.");
      }, 10000);

      setTimeout(() => {
        const msg2: Message = { 
          role: 'agent', type: 'trajectory', 
          thought: t('数据加载完成。发现 Age 和 Cabin 字段存在缺失值。我将编写 Python 代码进行特征工程。', 'Data loaded. Missing values in Age and Cabin. Writing Python code for imputation.'), 
          action: 'execute_ipython_cell', 
          actionInput: 'import pandas as pd\ntrain = pd.read_csv("./data/train.csv")\ntrain["Age"].fillna(train["Age"].median(), inplace=True)', 
          observation: 'Memory usage: 83.7 KB', 
          content: t('数据清洗与特征工程完毕。数据矩阵形状: (891, 12)。', 'Data cleaning complete. Shape: (891, 12).') 
        };
        setMessages((prev: Message[]) => [...prev, msg2]);
        appendMemory("Subtask: Feature Engineering", msg2);
        addLog(`[Dispatcher] Observation captured from Jupyter sandbox.`);
      }, 15000);

      setTimeout(() => {
        setTypingStatus(t('向 Ray 集群请求 GPU 算力，启动 Optuna 超参搜索...', 'Requesting GPU from Ray, starting Optuna hyperparameter search...'));
        addLog("[Dispatcher] scale_out triggered: Requesting 2 GPU nodes.");
      }, 20000);

      setTimeout(() => {
        setTypingStatus(t('训练完毕。聚合验证集精度并挂载模型文件...', 'Training complete. Aggregating CV metrics and mounting model file...'));
        const msg3: Message = { 
          role: 'agent', type: 'trajectory', 
          thought: t('特征准备就绪。我已调用分布式 XGBoost 框架进行超参搜索。', 'Features ready. Distributed XGBoost tuned via Optuna.'), 
          action: 'execute_ipython_cell', 
          actionInput: 'import xgboost as xgb\nmodel = xgb.XGBClassifier(**best_params)\nmodel.fit(X_train, y_train)', 
          observation: 'CV Accuracy: 0.8354', 
          content: t('模型训练非常成功，验证集交叉验证准确率达到 83.54%。', 'Model trained successfully. CV Accuracy: 83.54%.') 
        };
        setMessages((prev: Message[]) => [...prev, msg3]);
        appendMemory("Subtask: Distributed Training", msg3);
        addLog(`[ML_Engine] Model training completed successfully.`);
      }, 25000);

      setTimeout(() => {
        setTypingStatus(t('打包 submission.csv 并调用接口提交至 Kaggle...', 'Packaging submission and pushing to Kaggle...'));
        addLog("[Kaggle API] Submission package sent securely.");
        const msg4: Message = { 
          role: 'agent', type: 'trajectory', 
          thought: t('最后一步，我对测试集进行预测，并提交给 Kaggle 获取线上分数。', 'Final step: predict on test set and push via Kaggle CLI.'), 
          action: 'execute_bash', 
          actionInput: 'kaggle competitions submit -c titanic -f submission.csv', 
          observation: 'Your submission scored 0.79425', 
          content: t('🎉 Kaggle 比赛全自动参与流程结束！最终线上得分: 0.79425。', '🎉 Kaggle pipeline executed automatically! Final Score: 0.79425.') 
        };
        setMessages((prev: Message[]) => [...prev, msg4]);
        appendMemory("Subtask: Final Submission", msg4);
        addLog(`[Workflow] Autonomous Kaggle Task Pipeline finished.`);
        setIsTyping(false);
      }, 32000);

      return;
    }

    const totalTime = Math.floor(Math.random() * 3000) + 2000;
    setTypingStatus(t('解析标准指令...', 'Processing instruction...'));
    
    setTimeout(() => {
      let thought, action, actionInput, observation, content, isError = false;

      if (userText.includes('调度')) {
        thought = t('触发精细化调度。评估 can_step 策略...', 'Triggering scheduler. Evaluating can_step() policy...');
        action = 'scheduler.can_step';
        actionInput = 'agent_id="codeact_01"';
        observation = t('已授予时间片。', 'Step granted.');
        content = t('精细化切换机制已执行。Agent 已成功获取时间片。', 'Scheduling executed. Time slice allocated.');
      } else {
        thought = t('解析指令，生成安全代码...', 'Processing. Generating code...');
        action = 'execute_ipython_cell';
        actionInput = `print("Task done")`;
        observation = `Task done`;
        content = t('指令解析完成，代码已在底层沙盒环境中执行。', 'Instruction processed and executed safely.');
      }

      const agentMsg: Message = { role: 'agent', type: 'trajectory', thought, action, actionInput, observation, content, isError };
      setMessages((prev: Message[]) => [...prev, agentMsg]);
      addLog(`[ThreadExecutor] Executed ${action}.`);
      appendMemory(userText, agentMsg);
      setIsTyping(false);
    }, totalTime);
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative z-10 min-h-0">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>

      <div className="flex justify-between items-center p-4 border-b border-cyan-900/50 bg-[#050814]/90 backdrop-blur-xl relative z-20 shadow-md">
        <div className="flex gap-4 items-center">
          <span className="text-xs font-bold tracking-widest text-cyan-500 uppercase">Hub_Link:</span>
          <select className="bg-[#0b1426] text-cyan-300 font-mono text-sm rounded-lg px-4 py-2 border border-cyan-800/60 outline-none focus:border-cyan-400 transition-colors shadow-inner">
            {MOCK_SYSTEMS.map(sys => <option key={sys}>{sys}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <button onClick={onSaveSnapshot} className="group flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest bg-[#0b1426] hover:bg-cyan-900/50 text-cyan-400 hover:text-cyan-300 rounded-lg border border-cyan-700/50 transition-all shadow-inner">
            <Save size={14} /> {t('状态快照', 'Snapshot')}
          </button>
          <button onClick={onRestoreSnapshot} className="group flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest bg-[#0b1426] hover:bg-purple-900/50 text-purple-400 hover:text-purple-300 rounded-lg border border-purple-700/50 transition-all shadow-inner">
            <RotateCcw size={14} /> {t('快照恢复', 'Restore')}
          </button>
        </div>
      </div>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth min-h-0 relative z-10">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-cyan-500/30 blur-[40px] rounded-full h-32 w-32"></div>
              <DatabaseZap size={80} className="relative text-cyan-400/80 drop-shadow-[0_0_25px_rgba(6,182,212,0.8)]" />
            </div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500 mb-3 tracking-widest uppercase drop-shadow-md">
              {t('iGym 核心引擎已就绪', 'iGym Core Engaged')}
            </h2>
            <p className="text-sm text-cyan-600/80 font-mono tracking-widest uppercase">
              {t('系统等待环境注入指令...', 'System awaiting environmental injection...')}
            </p>
          </div>
        )}
        {messages.map((msg: Message, idx: number) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4`}>
            <div className={`max-w-[85%] rounded-2xl p-6 shadow-2xl backdrop-blur-md border ${
              msg.role === 'user' 
                ? 'bg-gradient-to-br from-cyan-700/90 to-blue-900/90 text-white border-cyan-400/40' 
                : 'bg-[#050814]/95 border-cyan-900/50 text-slate-300'
            }`}>
              {msg.role === 'user' ? (
                <p className="text-[15px] font-medium leading-relaxed tracking-wide">{msg.content}</p>
              ) : (
                <div className="space-y-5 font-mono text-sm">
                  {msg.thought && (
                    <div className="bg-[#02040a] p-4 rounded-xl border border-purple-900/40 relative overflow-hidden group shadow-inner">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,1)]"></div>
                      <div className="flex items-center gap-2 text-purple-400 mb-3 font-bold text-xs tracking-widest uppercase">
                        <Brain size={16} className="animate-pulse" /> {t('思考链路', 'Thought Process')}
                      </div>
                      <span className="text-slate-300 leading-relaxed text-[13px]">{msg.thought}</span>
                    </div>
                  )}
                  {msg.action && (
                    <div className="bg-[#02040a] p-4 rounded-xl border border-amber-900/40 relative overflow-hidden shadow-inner">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,1)]"></div>
                      <div className="flex items-center gap-2 text-amber-400 mb-3 font-bold text-xs tracking-widest uppercase">
                        <Wrench size={16} /> {t('调用工具', 'Tool Execution')}: <span className="text-amber-200">{msg.action}</span>
                      </div>
                      <pre className="text-xs overflow-x-auto text-amber-100/80 whitespace-pre-wrap bg-black/60 p-3 rounded-lg border border-amber-900/30">{msg.actionInput}</pre>
                    </div>
                  )}
                  {msg.observation && (
                    <div className={`bg-[#02040a] p-4 rounded-xl border relative overflow-hidden shadow-inner ${msg.isError ? 'border-red-900/40' : 'border-emerald-900/40'}`}>
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${msg.isError ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,1)]' : 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)]'}`}></div>
                      <div className={`flex items-center gap-2 mb-3 font-bold text-xs tracking-widest uppercase ${msg.isError ? 'text-red-400' : 'text-emerald-400'}`}>
                        <Activity size={16} /> {t('环境观测', 'Observation')}
                      </div>
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-black/60 p-3 rounded-lg border border-slate-800/60 text-slate-300">{msg.observation}</pre>
                    </div>
                  )}
                  <div className="pt-3 text-cyan-100 font-sans font-medium leading-relaxed text-[15px] border-t border-cyan-900/40">
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-start animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-[#050814]/90 backdrop-blur-xl border border-cyan-500/40 text-cyan-400 rounded-2xl p-5 flex items-center gap-5">
              <div className="relative flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,1)]"></span>
              </div>
              <span className="text-[13px] font-bold font-mono tracking-widest uppercase">{typingStatus}</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-[#050814]/95 backdrop-blur-2xl border-t border-cyan-900/50 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex gap-4">
          <input
            type="text"
            className="flex-1 bg-[#0b1426] border border-cyan-800/50 rounded-xl px-6 py-4 text-cyan-50 placeholder-cyan-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all font-medium text-[15px]"
            placeholder={t("输入指令以驱动智能体...", "Enter instructions to drive the agent...")}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button 
            onClick={handleSend}
            disabled={isTyping || !inputValue.trim()}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white p-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:shadow-none flex items-center justify-center w-20 group"
          >
            <Play size={24} className="ml-1 group-disabled:opacity-30" fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. Memory Explorer Component
const TreeNode = ({ node, t }: { node: MemoryNode, t: any }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const getTypeStyle = (type: string, status: string) => {
    if (status === 'error') return 'border-red-500/40 bg-red-950/20';
    switch(type) {
      case 'Task': return 'border-blue-500/40 bg-blue-950/20';
      case 'Thought': return 'border-purple-500/40 bg-purple-950/20';
      case 'Action': return 'border-amber-500/40 bg-amber-950/20';
      case 'Observation': return 'border-emerald-500/40 bg-emerald-950/20';
      default: return 'border-slate-700/50 bg-[#111827]';
    }
  };

  const getTranslatedType = (type: string) => {
    switch(type) {
      case 'Task': return t('任务', 'TASK');
      case 'Thought': return t('思考', 'THOUGHT');
      case 'Action': return t('执行', 'ACTION');
      case 'Observation': return t('观测', 'OBSERVATION');
      default: return type;
    }
  }

  return (
    <div className="ml-8 mt-4 relative group animate-in fade-in">
      <div className="absolute -left-6 top-0 bottom-0 w-px bg-cyan-900/30 group-hover:bg-cyan-500/60 transition-colors"></div>
      
      <div className="flex items-start gap-4 relative z-10">
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="mt-2 w-6 h-6 flex items-center justify-center rounded-md bg-[#0b1426] border border-cyan-800 text-cyan-600 hover:text-cyan-300 transition-all shadow-inner"
          disabled={!hasChildren}
        >
          {hasChildren ? (expanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>) : <span className="w-2 h-2 rounded-full bg-cyan-800"></span>}
        </button>
        <div className={`px-6 py-4 rounded-xl border backdrop-blur-md text-sm w-full max-w-4xl transition-all duration-300 ${getTypeStyle(node.type, node.status)}`}>
          <div className="flex justify-between items-center mb-3">
            <span className={`font-black text-[12px] uppercase tracking-widest ${node.status === 'error' ? 'text-red-400' : 'text-cyan-400'}`}>{getTranslatedType(node.type)}</span>
            {node.isSnapshot && (
              <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-400/50 px-3 py-1 rounded shadow-inner font-bold tracking-widest uppercase">
                {t('快照已锁定', 'SNAPSHOT_LOCKED')}
              </span>
            )}
          </div>
          <div className="text-slate-200 font-mono text-[13px] whitespace-pre-wrap leading-relaxed">{node.content}</div>
        </div>
      </div>
      {expanded && hasChildren && (
        <div className="mt-3">
          {node.children.map((child, idx) => <TreeNode key={idx} node={child} t={t} />)}
        </div>
      )}
    </div>
  );
};

const MemoryTab = ({ memoryTree, t }: any) => {
  return (
    <div className="p-10 h-full flex flex-col bg-transparent relative z-10 min-h-0">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>
      
      <div className="mb-8 relative z-10">
        <h2 className="text-3xl font-black text-slate-100 flex items-center gap-4 tracking-widest uppercase">
          <Network className="text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" size={32} /> 
          <span className="bg-gradient-to-r from-purple-400 to-indigo-400 text-transparent bg-clip-text drop-shadow-md">{t('记忆拓扑结构', 'Memory Structure')}</span>
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto bg-[#050814]/80 backdrop-blur-xl border border-cyan-900/40 rounded-3xl p-8 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] relative min-h-0">
        <TreeNode node={memoryTree} t={t} />
      </div>
    </div>
  );
};

// 4. Environment & Dispatcher Logs
const EnvTab = ({ logs, t }: any) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="p-10 h-full flex flex-col bg-transparent relative z-10 min-h-0">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>

      <div className="mb-8 relative z-10">
        <h2 className="text-3xl font-black text-slate-100 flex items-center gap-4 tracking-widest uppercase">
          <TerminalSquare className="text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" size={32} /> 
          <span className="bg-gradient-to-r from-emerald-400 to-teal-400 text-transparent bg-clip-text drop-shadow-md">{t('调度器终端', 'Dispatcher Logs')}</span>
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6 shrink-0 relative z-10">
        <div className="bg-[#0b1426]/90 backdrop-blur-xl p-6 rounded-2xl border border-cyan-900/40 shadow-xl">
          <div className="text-slate-500 text-[11px] font-black mb-3 uppercase tracking-widest">{t('后端执行引擎', 'Backend Executor')}</div>
          <div className="text-cyan-100 flex items-center gap-3 font-mono text-[15px] font-medium">
            <Cpu size={18} className="text-cyan-400"/> AsyncExecutor
          </div>
        </div>
        <div className="bg-[#0b1426]/90 backdrop-blur-xl p-6 rounded-2xl border border-emerald-900/40 shadow-xl">
          <div className="text-slate-500 text-[11px] font-black mb-3 uppercase tracking-widest">{t('集群状态', 'Cluster State')}</div>
          <div className="text-cyan-100 flex items-center gap-3 font-mono text-[15px] font-medium">
            <Server size={18} className="text-emerald-400"/> {t('Ray 节点池就绪', 'Ray Active')}
          </div>
        </div>
        <div className="bg-[#0b1426]/90 backdrop-blur-xl p-6 rounded-2xl border border-purple-900/40 shadow-xl">
          <div className="text-slate-500 text-[11px] font-black mb-3 uppercase tracking-widest">{t('调度队列', 'Queue Status')}</div>
          <div className="text-cyan-100 flex items-center gap-3 font-mono text-[15px] font-medium">
            <Layers size={18} className="text-purple-400"/> {t(`${logs.length} 条操作`, `${logs.length} Ops`)}
          </div>
        </div>
      </div>
      <div ref={logContainerRef} className="flex-1 bg-[#02040a]/95 rounded-3xl border border-cyan-900/30 font-mono text-[14px] p-8 overflow-y-auto shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] leading-relaxed relative min-h-0 z-10">
        {logs.map((log: LogEntry, i: number) => (
          <div key={i} className="mb-2 flex gap-4 hover:bg-cyan-900/20 px-3 py-1 rounded-md transition-colors">
            <span className="text-cyan-700/80 shrink-0 font-bold">[{log.time}]</span>
            <span className={`break-all font-medium ${
              log.text.includes('CRITICAL') ? 'text-red-400 shadow-sm' :
              log.text.includes('Ray') ? 'text-blue-400' :
              log.text.includes('execute_') ? 'text-amber-400' : 'text-slate-400'
            }`}>{log.text}</span>
          </div>
        ))}
        <div className="text-cyan-500 mt-4 animate-pulse ml-3 font-black text-lg">_</div>
      </div>
    </div>
  );
};

// 5. System Monitor
const MonitorTab = ({ t }: any) => {
  return (
    <div className="p-10 h-full flex flex-col bg-transparent relative z-10 overflow-y-auto min-h-0">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>

      <div className="mb-10 relative z-10">
        <h2 className="text-3xl font-black text-slate-100 flex items-center gap-4 tracking-widest uppercase">
          <BarChart3 className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" size={32} /> 
          <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-transparent bg-clip-text drop-shadow-md">{t('量化评估面板', 'Telemetry')}</span>
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8 shrink-0 relative z-10">
        <div className="bg-[#0b1426]/90 backdrop-blur-xl border border-emerald-900/40 rounded-3xl p-8 shadow-2xl">
          <h3 className="text-emerald-500 text-[12px] font-black uppercase tracking-widest flex items-center gap-3 mb-8">
            <CheckCircle2 size={18} /> {t('任务成功率', 'Success Rates')}
          </h3>
          <div className="space-y-8">
            <div>
              <div className="flex justify-between text-[15px] mb-3 text-slate-200 font-bold">
                <span>{t('端到端成功率', 'E2E Success')}</span>
                <span className="font-mono text-emerald-400">92.4%</span>
              </div>
              <div className="w-full bg-[#050814] rounded-full h-3.5 overflow-hidden shadow-inner"><div className="bg-emerald-500 h-3.5 rounded-full" style={{width: '92.4%'}}></div></div>
            </div>
          </div>
        </div>

        <div className="bg-[#0b1426]/90 backdrop-blur-xl border border-amber-900/40 rounded-3xl p-8 shadow-2xl">
          <h3 className="text-amber-500 text-[12px] font-black uppercase tracking-widest flex items-center gap-3 mb-8">
            <Zap size={18} /> {t('性能开销', 'Performance')}
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#050814] border border-amber-900/30 rounded-2xl p-6 text-center">
              <div className="text-4xl font-black font-mono text-amber-400 mb-2">1.2s</div>
              <div className="text-[12px] text-slate-500 font-bold uppercase mt-3">{t('恢复耗时', 'Restore Time')}</div>
            </div>
            <div className="bg-[#050814] border border-cyan-900/30 rounded-2xl p-6 text-center">
              <div className="text-4xl font-black font-mono text-cyan-400 mb-2">0.8s</div>
              <div className="text-[12px] text-slate-500 font-bold uppercase mt-3">{t('调度损耗', 'Overhead')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [toast, setToast] = useState<string | null>(null);
  const [lang, setLang] = useState('zh');

  const t = (zhText: string, enText: string) => lang === 'zh' ? zhText : enText;

  const [messages, setMessages] = useState<Message[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [memoryTree, setMemoryTree] = useState<MemoryNode | null>(null);
  const [snapshot, setSnapshot] = useState<any>(null);
  
  useEffect(() => {
    const initTime = getBeijingTime();
    setLogs([
      { time: initTime, text: t("[系统] iGym 框架加载完毕。时区: 亚洲/上海", "[System] iGym Core initialized. Timezone: Asia/Shanghai.") },
      { time: initTime, text: t("[引擎] CodeAct Agent 实例化成功。", "[Agent] CodeAct Agent instantiated.") }
    ]);
    setMemoryTree({
      id: 'root-001',
      content: t('系统初始化 (iGym v1.0)', 'System initialized (iGym v1.0)'),
      type: 'Task',
      status: 'success',
      children: []
    });
  }, [lang]);

  const addLog = (newLogText: string) => {
    setLogs(prev => [...prev, { time: getBeijingTime(), text: newLogText }]);
  };

  const appendMemory = (userRequest: string, agentMsg: Message) => {
    setMemoryTree(prevTree => {
      if (!prevTree) return null;
      const newNode: MemoryNode = {
        type: 'Task',
        content: `${t('下发指令', 'Dispatch')}: ${userRequest}`,
        status: agentMsg.isError ? 'error' : 'success',
        children: [
          {
            type: 'Thought',
            content: agentMsg.thought || '',
            status: 'success',
            children: [
              {
                type: 'Action',
                content: `${t('调用', 'Call')}: ${agentMsg.action}\n${t('参数', 'Payload')}: ${agentMsg.actionInput}`,
                status: agentMsg.isError ? 'error' : 'success',
                children: [
                  {
                    type: 'Observation',
                    content: agentMsg.observation || '',
                    status: agentMsg.isError ? 'error' : 'success',
                    children: []
                  }
                ]
              }
            ]
          }
        ]
      };
      return { ...prevTree, children: [...prevTree.children, newNode] };
    });
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaveSnapshot = () => {
    setSnapshot({
      messages: JSON.parse(JSON.stringify(messages)),
      logs: [...logs],
      memoryTree: JSON.parse(JSON.stringify(memoryTree))
    });
    setMemoryTree((prev: any) => ({ ...prev, isSnapshot: true }));
    addLog(t(`[状态管理] 记忆流快照已锁定。`, `[StateManager] Memory snapshot locked.`));
    showToast(t('状态快照已保存！', 'Snapshot Saved!'));
  };

  const handleRestoreSnapshot = () => {
    if (!snapshot) {
      showToast(t('未找到导出快照', 'No snapshot found'));
      return;
    }
    setMessages(JSON.parse(JSON.stringify(snapshot.messages)));
    setLogs([
      ...snapshot.logs, 
      { time: getBeijingTime(), text: t(`[状态管理] 环境已无损恢复。`, `[StateManager] Environment restored.`) }
    ]);
    setMemoryTree(JSON.parse(JSON.stringify(snapshot.memoryTree)));
    showToast(t('系统已成功回滚！', 'Restored!'));
  };

  if (!memoryTree) return null;

  return (
    <div className="flex h-screen w-full bg-[#02050a] font-sans selection:bg-cyan-500/30 relative overflow-hidden text-slate-200">
      
      {/* Aesthetic Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-700/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[60%] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

      {toast && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-50 bg-[#0B1426]/95 backdrop-blur-xl border border-cyan-400/50 text-cyan-50 px-8 py-4 rounded-2xl shadow-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={20} className="text-cyan-400" />
          <span className="font-bold text-[15px] tracking-widest uppercase">{toast}</span>
        </div>
      )}

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} lang={lang} setLang={setLang} t={t} />
      
      <main className="flex-1 flex flex-col min-w-0 relative z-10 h-screen">
        <div className={activeTab === 'chat' ? 'h-full block min-h-0' : 'hidden'}>
          <WorkspaceTab 
            messages={messages} 
            setMessages={setMessages} 
            addLog={addLog}
            appendMemory={appendMemory}
            onSaveSnapshot={handleSaveSnapshot}
            onRestoreSnapshot={handleRestoreSnapshot}
            t={t}
          />
        </div>
        <div className={activeTab === 'memory' ? 'h-full block min-h-0' : 'hidden'}>
          <MemoryTab memoryTree={memoryTree} t={t} />
        </div>
        <div className={activeTab === 'env' ? 'h-full block min-h-0' : 'hidden'}>
          < EnvTab logs={logs} t={t} />
        </div>
        <div className={activeTab === 'status' ? 'h-full block min-h-0' : 'hidden'}>
          <MonitorTab t={t} />
        </div>
      </main>
    </div>
  );
}
