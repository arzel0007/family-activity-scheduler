import { useState } from 'react'

export interface TodoItem {
  id: string
  text: string
  completed: boolean
  createdAt: number
}

interface Props {
  todos: TodoItem[]
  onTodosChange: (todos: TodoItem[]) => void
  readOnly?: boolean
}

export function ActivityTodoList({ todos, onTodosChange, readOnly = false }: Props) {
  const [newTodo, setNewTodo] = useState('')

  function addTodo() {
    if (!newTodo.trim() || readOnly) return
    const todo: TodoItem = {
      id: Date.now().toString(),
      text: newTodo,
      completed: false,
      createdAt: Date.now(),
    }
    onTodosChange([...todos, todo])
    setNewTodo('')
  }

  function toggleTodo(id: string) {
    if (readOnly) return
    onTodosChange(
      todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }

  function removeTodo(id: string) {
    if (readOnly) return
    onTodosChange(todos.filter((t) => t.id !== id))
  }

  const completedCount = todos.filter((t) => t.completed).length

  return (
    <div className="space-y-3 bg-canvas-sand p-4 rounded-md border border-pale-granite">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-charcoal-black">
          Activity Checklist
          {todos.length > 0 && (
            <span className="text-sm text-graphite-grey ml-2">
              ({completedCount}/{todos.length})
            </span>
          )}
        </h4>
      </div>

      {!readOnly && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a todo..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTodo()
            }}
            className="input flex-1 text-sm py-2"
          />
          <button
            onClick={addTodo}
            disabled={!newTodo.trim()}
            className="btn-primary text-sm px-3 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}

      {todos.length === 0 ? (
        <p className="text-sm text-graphite-grey italic">
          {readOnly ? 'No todos yet' : 'No todos added yet'}
        </p>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className={`flex items-center gap-2 p-2 rounded transition-colors ${
                todo.completed
                  ? 'bg-pale-granite text-graphite-grey line-through'
                  : 'bg-surface-white text-charcoal-black'
              }`}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                disabled={readOnly}
                className="w-4 h-4 cursor-pointer rounded accent-sky-blue"
              />
              <span className="flex-1 text-sm">{todo.text}</span>
              {!readOnly && (
                <button
                  onClick={() => removeTodo(todo.id)}
                  className="text-graphite-grey hover:text-sunset-orange transition-colors text-sm"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
