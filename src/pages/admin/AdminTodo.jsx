import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckSquare, Square, Plus, Pencil, Trash2, ChevronDown, ChevronRight, AlertCircle, ArrowUpCircle, Circle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import useMyProfile from '@/hooks/useMyProfile';

const PRIORITY_CONFIG = {
  low:      { label: 'Low',      color: 'text-slate-500',  bg: 'bg-slate-100'  },
  medium:   { label: 'Medium',   color: 'text-blue-600',   bg: 'bg-blue-50'    },
  high:     { label: 'High',     color: 'text-orange-600', bg: 'bg-orange-50'  },
  critical: { label: 'Critical', color: 'text-red-600',    bg: 'bg-red-50'     },
};

const STATUS_CONFIG = {
  todo:        { label: 'To Do',       icon: Circle,        color: 'text-slate-400'  },
  in_progress: { label: 'In Progress', icon: ArrowUpCircle, color: 'text-blue-500'   },
  done:        { label: 'Done',        icon: CheckSquare,   color: 'text-green-500'  },
};

const EMPTY_FORM = { title: '', description: '', priority: 'medium', status: 'todo', category: '' };

export default function AdminTodo() {
  const { user } = useMyProfile();
  const qc = useQueryClient();
  const [editItem, setEditItem] = useState(null); // null = closed, EMPTY_FORM = new, existing = edit
  const [collapsed, setCollapsed] = useState({});
  const [filter, setFilter] = useState('all'); // all | todo | in_progress | done

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ['admin-todos'],
    queryFn: () => base44.entities.AdminTodo.list('sort_order', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AdminTodo.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-todos'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AdminTodo.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-todos'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AdminTodo.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-todos'] }),
  });

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Admins only.</p>
      </div>
    );
  }

  const toggleStatus = (todo) => {
    const next = todo.status === 'done' ? 'todo' : todo.status === 'todo' ? 'in_progress' : 'done';
    updateMutation.mutate({ id: todo.id, data: { status: next } });
  };

  const handleSave = (form) => {
    if (form.id) {
      updateMutation.mutate({ id: form.id, data: form });
    } else {
      createMutation.mutate({ ...form, sort_order: todos.length });
    }
    setEditItem(null);
  };

  // Group by category
  const filtered = filter === 'all' ? todos : todos.filter(t => t.status === filter);
  const categories = [...new Set(filtered.map(t => t.category || 'General'))];

  const totalDone = todos.filter(t => t.status === 'done').length;
  const pct = todos.length ? Math.round((totalDone / todos.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-heading text-3xl font-bold">Admin To-Do List</h1>
          <Button onClick={() => setEditItem(EMPTY_FORM)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Task
          </Button>
        </div>
        <p className="text-muted-foreground mb-4">Track outstanding development and configuration tasks.</p>

        {/* Progress bar */}
        <div className="flex items-center gap-4 p-4 bg-card border rounded-xl mb-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{totalDone} / {todos.length} tasks completed</span>
              <span className="text-muted-foreground">{pct}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div className="bg-primary rounded-full h-2.5 transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <Badge variant={pct === 100 ? 'default' : pct >= 75 ? 'secondary' : 'outline'}>
            {pct === 100 ? '✅ All Done' : pct >= 75 ? 'Almost Done' : 'In Progress'}
          </Badge>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'todo', 'in_progress', 'done'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              {f === 'all' ? 'All' : STATUS_CONFIG[f].label}
              <span className="ml-1.5 text-xs opacity-70">
                ({f === 'all' ? todos.length : todos.filter(t => t.status === f).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Grouped list */}
      <div className="space-y-4">
        {categories.map(cat => {
          const items = filtered.filter(t => (t.category || 'General') === cat);
          if (!items.length) return null;
          const isCollapsed = collapsed[cat];
          return (
            <div key={cat} className="bg-card border rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
                onClick={() => setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }))}
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{cat}</span>
                  <Badge variant="outline" className="text-xs">
                    {items.filter(i => i.status === 'done').length}/{items.length}
                  </Badge>
                </div>
                {isCollapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              {!isCollapsed && (
                <div className="border-t divide-y">
                  {items.map(todo => {
                    const StatusIcon = STATUS_CONFIG[todo.status]?.icon || Circle;
                    const statusColor = STATUS_CONFIG[todo.status]?.color || 'text-slate-400';
                    const pri = PRIORITY_CONFIG[todo.priority] || PRIORITY_CONFIG.medium;
                    return (
                      <div key={todo.id} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/20 transition-colors group">
                        <button
                          className={`mt-0.5 flex-shrink-0 ${statusColor} hover:opacity-70 transition-opacity`}
                          onClick={() => toggleStatus(todo)}
                          title="Cycle status"
                        >
                          <StatusIcon className="w-5 h-5" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium leading-relaxed ${todo.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                              {todo.title}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pri.color} ${pri.bg}`}>
                              {pri.label}
                            </span>
                          </div>
                          {todo.description && (
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed whitespace-pre-wrap">{todo.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={() => setEditItem(todo)} className="p-1.5 rounded hover:bg-muted transition-colors">
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={() => deleteMutation.mutate(todo.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {filter === 'all' ? 'No tasks yet. Add your first task!' : `No tasks with status "${STATUS_CONFIG[filter]?.label}".`}
          </div>
        )}
      </div>

      {/* Edit / Create Dialog */}
      {editItem !== null && (
        <TodoFormDialog
          item={editItem}
          onSave={handleSave}
          onClose={() => setEditItem(null)}
          existingCategories={[...new Set(todos.map(t => t.category).filter(Boolean))]}
        />
      )}
    </div>
  );
}

function TodoFormDialog({ item, onSave, onClose, existingCategories }) {
  const [form, setForm] = useState(item);
  const isNew = !form.id;

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Add Task' : 'Edit Task'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-1 block">Title *</label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Task title..." />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Description / Notes</label>
            <Textarea value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Details, context, links..." className="min-h-[80px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Priority</label>
              <Select value={form.priority} onValueChange={v => set('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Category</label>
            <Input
              value={form.category || ''}
              onChange={e => set('category', e.target.value)}
              placeholder="e.g. Authentication, Payments..."
              list="category-suggestions"
            />
            <datalist id="category-suggestions">
              {existingCategories.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={!form.title?.trim()}>
            {isNew ? 'Add Task' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}