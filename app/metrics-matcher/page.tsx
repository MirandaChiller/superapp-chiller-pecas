"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, X, Edit, Trash2, ChevronDown, ChevronUp, Calendar, User, Flag, GripVertical } from "lucide-react";

interface Column {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
}

interface Task {
  id: string;
  column_id: string;
  titulo: string;
  descricao: string;
  responsavel: string;
  data_vencimento: string;
  prioridade: string;
  ordem: number;
  tags?: Tag[];
}

interface Tag {
  id: string;
  nome: string;
  cor: string;
}

const TEAM_MEMBERS = [
  "Miranda Chiller",
  "João Silva",
  "Maria Santos",
  "Pedro Costa",
  "Equipe Marketing",
  "Não atribuído"
];

const PRIORIDADES = [
  { valor: "Urgente", cor: "#dc2626", emoji: "🔴" },
  { valor: "Alta", cor: "#ff901c", emoji: "🟠" },
  { valor: "Média", cor: "#fbbf24", emoji: "🟡" },
  { valor: "Baixa", cor: "#10b981", emoji: "🟢" }
];

export default function TasksPage() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  
  // Modals
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState("");
  
  // Filtros
  const [filterResponsavel, setFilterResponsavel] = useState("Todos");
  const [filterPrioridade, setFilterPrioridade] = useState("Todas");
  const [filterTag, setFilterTag] = useState("Todas");
  
  // Forms
  const [columnForm, setColumnForm] = useState({ nome: "", cor: "#085ba7" });
  const [taskForm, setTaskForm] = useState({
    titulo: "",
    descricao: "",
    responsavel: "Não atribuído",
    data_vencimento: "",
    prioridade: "Média",
    tag_ids: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    
    const { data: colsData } = await supabase
      .from("kanban_columns")
      .select("*")
      .order("ordem");
    
    if (colsData) setColumns(colsData);
    
    const { data: tasksData } = await supabase
      .from("kanban_tasks")
      .select(`
        *,
        kanban_task_tags (
          kanban_tags (*)
        )
      `)
      .order("ordem");
    
    if (tasksData) {
      const formatted = tasksData.map(t => ({
        ...t,
        tags: t.kanban_task_tags?.map((tt: any) => tt.kanban_tags) || []
      }));
      setTasks(formatted);
    }
    
    const { data: tagsData } = await supabase
      .from("kanban_tags")
      .select("*")
      .order("nome");
    
    if (tagsData) setTags(tagsData);
    
    setLoading(false);
  }

  async function saveColumn() {
    if (!columnForm.nome) return;
    
    if (editingColumn) {
      await supabase
        .from("kanban_columns")
        .update(columnForm)
        .eq("id", editingColumn.id);
    } else {
      const maxOrdem = Math.max(...columns.map(c => c.ordem), 0);
      await supabase
        .from("kanban_columns")
        .insert({ ...columnForm, ordem: maxOrdem + 1 });
    }
    
    setShowColumnModal(false);
    setEditingColumn(null);
    setColumnForm({ nome: "", cor: "#085ba7" });
    loadData();
  }

  async function deleteColumn(id: string) {
    if (!confirm("Excluir esta coluna e todas suas tarefas?")) return;
    await supabase.from("kanban_columns").delete().eq("id", id);
    loadData();
  }

  async function saveTask() {
    if (!taskForm.titulo || !selectedColumnId) return;
    
    if (editingTask) {
      const { data: updated } = await supabase
        .from("kanban_tasks")
        .update({
          titulo: taskForm.titulo,
          descricao: taskForm.descricao,
          responsavel: taskForm.responsavel,
          data_vencimento: taskForm.data_vencimento || null,
          prioridade: taskForm.prioridade
        })
        .eq("id", editingTask.id)
        .select()
        .single();
      
      if (updated) {
        await supabase.from("kanban_task_tags").delete().eq("task_id", updated.id);
        if (taskForm.tag_ids.length > 0) {
          await supabase.from("kanban_task_tags").insert(
            taskForm.tag_ids.map(tag_id => ({ task_id: updated.id, tag_id }))
          );
        }
      }
    } else {
      const maxOrdem = Math.max(
        ...tasks.filter(t => t.column_id === selectedColumnId).map(t => t.ordem),
        -1
      );
      
      const { data: newTask } = await supabase
        .from("kanban_tasks")
        .insert({
          column_id: selectedColumnId,
          titulo: taskForm.titulo,
          descricao: taskForm.descricao,
          responsavel: taskForm.responsavel,
          data_vencimento: taskForm.data_vencimento || null,
          prioridade: taskForm.prioridade,
          ordem: maxOrdem + 1
        })
        .select()
        .single();
      
      if (newTask && taskForm.tag_ids.length > 0) {
        await supabase.from("kanban_task_tags").insert(
          taskForm.tag_ids.map(tag_id => ({ task_id: newTask.id, tag_id }))
        );
      }
    }
    
    setShowTaskModal(false);
    setEditingTask(null);
    resetTaskForm();
    loadData();
  }

  async function deleteTask(id: string) {
    if (!confirm("Excluir esta tarefa?")) return;
    await supabase.from("kanban_tasks").delete().eq("id", id);
    loadData();
  }

  async function reorderTasks(draggedTask: Task, targetTask: Task) {
    const columnTasks = tasks
      .filter(t => t.column_id === targetTask.column_id)
      .sort((a, b) => a.ordem - b.ordem);
    
    const draggedIndex = columnTasks.findIndex(t => t.id === draggedTask.id);
    const targetIndex = columnTasks.findIndex(t => t.id === targetTask.id);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Remove da posição original
    columnTasks.splice(draggedIndex, 1);
    // Insere na nova posição
    columnTasks.splice(targetIndex, 0, draggedTask);
    
    // Atualiza ordens no banco
    const updates = columnTasks.map((task, index) => ({
      id: task.id,
      column_id: targetTask.column_id,
      ordem: index
    }));
    
    for (const update of updates) {
      await supabase
        .from("kanban_tasks")
        .update({ ordem: update.ordem, column_id: update.column_id })
        .eq("id", update.id);
    }
    
    loadData();
  }

  async function moveTaskToColumn(taskId: string, newColumnId: string) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.column_id === newColumnId) return;
    
    const maxOrdem = Math.max(
      ...tasks.filter(t => t.column_id === newColumnId).map(t => t.ordem),
      -1
    );
    
    await supabase
      .from("kanban_tasks")
      .update({ column_id: newColumnId, ordem: maxOrdem + 1 })
      .eq("id", taskId);
    
    loadData();
  }

  function handleDragStart(taskId: string) {
    setDraggedTaskId(taskId);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleTaskDragOver(e: React.DragEvent, taskId: string) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTaskId(taskId);
  }

  function handleTaskDrop(e: React.DragEvent, targetTaskId: string) {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedTaskId && draggedTaskId !== targetTaskId) {
      const draggedTask = tasks.find(t => t.id === draggedTaskId);
      const targetTask = tasks.find(t => t.id === targetTaskId);
      
      if (draggedTask && targetTask) {
        if (draggedTask.column_id === targetTask.column_id) {
          // Reordenar na mesma coluna
          reorderTasks(draggedTask, targetTask);
        } else {
          // Mover para outra coluna
          moveTaskToColumn(draggedTaskId, targetTask.column_id);
        }
      }
    }
    
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  }

  function handleColumnDrop(columnId: string) {
    if (draggedTaskId) {
      moveTaskToColumn(draggedTaskId, columnId);
      setDraggedTaskId(null);
      setDragOverTaskId(null);
    }
  }

  function openEditTask(task: Task) {
    setTaskForm({
      titulo: task.titulo,
      descricao: task.descricao || "",
      responsavel: task.responsavel || "Não atribuído",
      data_vencimento: task.data_vencimento || "",
      prioridade: task.prioridade || "Média",
      tag_ids: task.tags?.map(t => t.id) || []
    });
    setSelectedColumnId(task.column_id);
    setEditingTask(task);
    setShowTaskModal(true);
  }

  function openNewTask(columnId: string) {
    resetTaskForm();
    setSelectedColumnId(columnId);
    setShowTaskModal(true);
  }

  function resetTaskForm() {
    setTaskForm({
      titulo: "",
      descricao: "",
      responsavel: "Não atribuído",
      data_vencimento: "",
      prioridade: "Média",
      tag_ids: []
    });
  }

  function toggleExpand(taskId: string) {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }

  function getFilteredTasks(columnId: string) {
    return tasks
      .filter(t => t.column_id === columnId)
      .filter(t => filterResponsavel === "Todos" || t.responsavel === filterResponsavel)
      .filter(t => filterPrioridade === "Todas" || t.prioridade === filterPrioridade)
      .filter(t => {
        if (filterTag === "Todas") return true;
        return t.tags?.some(tag => tag.nome === filterTag);
      })
      .sort((a, b) => a.ordem - b.ordem);
  }

  function getTaskPriorityColor(prioridade: string) {
    return PRIORIDADES.find(p => p.valor === prioridade)?.cor || "#94a3b8";
  }

  function isTaskOverdue(dataVencimento: string) {
    if (!dataVencimento) return false;
    return new Date(dataVencimento) < new Date();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-[#108bd1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gerenciamento de Tarefas</h1>
          <p className="text-slate-600">Organize e acompanhe as tarefas da equipe</p>
        </div>
        <button
          onClick={() => {
            setEditingColumn(null);
            setColumnForm({ nome: "", cor: "#085ba7" });
            setShowColumnModal(true);
          }}
          className="px-6 py-3 bg-gradient-to-r from-[#ff901c] to-[#085ba7] text-white rounded-lg hover:shadow-lg transition-all font-semibold flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Coluna</span>
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1 block">Responsável</label>
            <select
              value={filterResponsavel}
              onChange={(e) => setFilterResponsavel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#108bd1]"
            >
              <option>Todos</option>
              {TEAM_MEMBERS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1 block">Prioridade</label>
            <select
              value={filterPrioridade}
              onChange={(e) => setFilterPrioridade(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#108bd1]"
            >
              <option>Todas</option>
              {PRIORIDADES.map(p => <option key={p.valor}>{p.valor}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1 block">Tag</label>
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#108bd1]"
            >
              <option>Todas</option>
              {tags.map(t => <option key={t.id}>{t.nome}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex space-x-4 min-w-max">
          {columns.map(column => {
            const columnTasks = getFilteredTasks(column.id);
            
            return (
              <div
                key={column.id}
                className="w-80 flex-shrink-0 bg-slate-50 rounded-xl"
                style={{ borderTop: `4px solid ${column.cor}` }}
                onDragOver={handleDragOver}
                onDrop={() => handleColumnDrop(column.id)}
              >
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                      <GripVertical className="w-4 h-4 text-slate-400" />
                      <span>{column.nome}</span>
                      <span className="text-xs bg-slate-200 px-2 py-1 rounded-full">
                        {columnTasks.length}
                      </span>
                    </h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setColumnForm({ nome: column.nome, cor: column.cor });
                          setEditingColumn(column);
                          setShowColumnModal(true);
                        }}
                        className="p-1 hover:bg-slate-200 rounded"
                      >
                        <Edit className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        onClick={() => deleteColumn(column.id)}
                        className="p-1 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => openNewTask(column.id)}
                    className="w-full py-2 bg-white border-2 border-dashed border-slate-300 rounded-lg hover:border-[#108bd1] hover:bg-blue-50 transition-all text-sm font-medium text-slate-600 flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nova Tarefa</span>
                  </button>
                </div>

                <div className="p-3 space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto min-h-[200px]">
                  {columnTasks.map(task => {
                    const isExpanded = expandedTasks.has(task.id);
                    const isOverdue = isTaskOverdue(task.data_vencimento);
                    const priorityColor = getTaskPriorityColor(task.prioridade);
                    const isDragging = draggedTaskId === task.id;
                    const isDragOver = dragOverTaskId === task.id;
                    
                    return (
                      <div
                        key={task.id}
                        className={`bg-white rounded-lg shadow-sm border-2 transition-all cursor-move ${
                          isDragging ? 'opacity-50 border-slate-300' : 
                          isDragOver ? 'border-[#108bd1] border-dashed' : 'border-slate-200'
                        } hover:shadow-md`}
                        draggable
                        onDragStart={() => handleDragStart(task.id)}
                        onDragOver={(e) => handleTaskDragOver(e, task.id)}
                        onDrop={(e) => handleTaskDrop(e, task.id)}
                      >
                        <div className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start space-x-2 flex-1">
                              <GripVertical className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                              <h4 className="font-semibold text-slate-900 flex-1">{task.titulo}</h4>
                            </div>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => openEditTask(task)}
                                className="p-1 hover:bg-blue-50 rounded"
                              >
                                <Edit className="w-4 h-4 text-[#085ba7]" />
                              </button>
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="p-1 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                              <button
                                onClick={() => toggleExpand(task.id)}
                                className="p-1 hover:bg-slate-100 rounded"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-2 ml-6">
                            {task.responsavel && (
                              <span className="text-xs flex items-center space-x-1 text-slate-600">
                                <User className="w-3 h-3" />
                                <span>{task.responsavel}</span>
                              </span>
                            )}
                            {task.data_vencimento && (
                              <span className={`text-xs flex items-center space-x-1 ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(task.data_vencimento).toLocaleDateString('pt-BR')}</span>
                              </span>
                            )}
                            {task.prioridade && (
                              <span className="text-xs flex items-center space-x-1 font-medium" style={{ color: priorityColor }}>
                                <Flag className="w-3 h-3" />
                                <span>{task.prioridade}</span>
                              </span>
                            )}
                          </div>

                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2 ml-6">
                              {task.tags.map(tag => (
                                <span
                                  key={tag.id}
                                  className="px-2 py-1 text-xs font-medium rounded-full text-white"
                                  style={{ backgroundColor: tag.cor }}
                                >
                                  {tag.nome}
                                </span>
                              ))}
                            </div>
                          )}

                          {isExpanded && task.descricao && (
                            <div className="mt-2 pt-2 border-t border-slate-100 ml-6">
                              <p className="text-sm text-slate-600 whitespace-pre-wrap">{task.descricao}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {columnTasks.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      Arraste tarefas aqui
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showColumnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">
              {editingColumn ? "Editar Coluna" : "Nova Coluna"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nome</label>
                <input
                  type="text"
                  value={columnForm.nome}
                  onChange={(e) => setColumnForm({ ...columnForm, nome: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#108bd1]"
                  placeholder="Ex: Em Andamento"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Cor</label>
                <input
                  type="color"
                  value={columnForm.cor}
                  onChange={(e) => setColumnForm({ ...columnForm, cor: e.target.value })}
                  className="w-full h-12 border border-slate-300 rounded-lg cursor-pointer"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowColumnModal(false);
                    setEditingColumn(null);
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveColumn}
                  className="flex-1 px-4 py-2 bg-[#ff901c] text-white rounded-lg hover:bg-[#e58318] font-semibold"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full my-8">
            <h2 className="text-2xl font-bold mb-4">
              {editingTask ? "Editar Tarefa" : "Nova Tarefa"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Título *</label>
                <input
                  type="text"
                  value={taskForm.titulo}
                  onChange={(e) => setTaskForm({ ...taskForm, titulo: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#108bd1]"
                  placeholder="Ex: Criar posts Black Friday"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Descrição</label>
                <textarea
                  value={taskForm.descricao}
                  onChange={(e) => setTaskForm({ ...taskForm, descricao: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#108bd1]"
                  placeholder="Detalhes da tarefa..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Responsável</label>
                  <select
                    value={taskForm.responsavel}
                    onChange={(e) => setTaskForm({ ...taskForm, responsavel: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#108bd1]"
                  >
                    {TEAM_MEMBERS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Prioridade</label>
                  <select
                    value={taskForm.prioridade}
                    onChange={(e) => setTaskForm({ ...taskForm, prioridade: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#108bd1]"
                  >
                    {PRIORIDADES.map(p => (
                      <option key={p.valor} value={p.valor}>{p.emoji} {p.valor}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Data de Vencimento</label>
                <input
                  type="date"
                  value={taskForm.data_vencimento}
                  onChange={(e) => setTaskForm({ ...taskForm, data_vencimento: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#108bd1]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        setTaskForm({
                          ...taskForm,
                          tag_ids: taskForm.tag_ids.includes(tag.id)
                            ? taskForm.tag_ids.filter(id => id !== tag.id)
                            : [...taskForm.tag_ids, tag.id]
                        });
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        taskForm.tag_ids.includes(tag.id)
                          ? 'text-white'
                          : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                      }`}
                      style={taskForm.tag_ids.includes(tag.id) ? { backgroundColor: tag.cor } : {}}
                    >
                      {tag.nome}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowTaskModal(false);
                    setEditingTask(null);
                    resetTaskForm();
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveTask}
                  className="flex-1 px-4 py-2 bg-[#ff901c] text-white rounded-lg hover:bg-[#e58318] font-semibold"
                >
                  {editingTask ? "Atualizar" : "Criar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
