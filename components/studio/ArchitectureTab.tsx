import { Plus, Database, Key, Type, Calendar, Hash, ToggleLeft, FileText, Trash2, Download, Code, Play, Eye, Box } from 'lucide-react';
import { useStudio } from '../../contexts/StudioContext';
import { studioService } from '../../services/studioService';
import MermaidChart from './MermaidChart';

interface Field {
    id: string;
    name: string;
    type: 'string' | 'number' | 'boolean' | 'datetime' | 'text' | 'json';
    isPrimary?: boolean;
    isRequired?: boolean;
    isUnique?: boolean;
    defaultValue?: string;
}

interface Table {
    id: string;
    name: string;
    position: { x: number; y: number };
    fields: Field[];
}

interface Relation {
    id: string;
    from: { tableId: string; fieldId: string };
    to: { tableId: string; fieldId: string };
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

const ArchitectureTab: React.FC = () => {
    const { currentProject } = useStudio();
    const [tables, setTables] = useState<Table[]>([]);
    const [relations, setRelations] = useState<Relation[]>([]);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [showAddTable, setShowAddTable] = useState(false);
    const [newTableName, setNewTableName] = useState('');
    const [view, setView] = useState<'canvas' | 'diagram' | 'code'>('canvas');

    // Load architecture when project changes
    useEffect(() => {
        if (currentProject?.id) {
            studioService.getArchitecture(currentProject.id).then(arch => {
                if (arch) {
                    setTables(arch.tables || []);
                    setRelations(arch.relations || []);
                }
            });
        }
    }, [currentProject?.id]);

    // Auto-save architecture
    useEffect(() => {
        if (currentProject?.id && (tables.length > 0 || relations.length > 0)) {
            const saveTimeout = setTimeout(() => {
                studioService.saveArchitecture(currentProject.id, { tables, relations });
            }, 1000);
            return () => clearTimeout(saveTimeout);
        }
    }, [tables, relations, currentProject?.id]);

    const fieldTypes = [
        { value: 'string', label: 'String', icon: Type },
        { value: 'number', label: 'Number', icon: Hash },
        { value: 'boolean', label: 'Boolean', icon: ToggleLeft },
        { value: 'datetime', label: 'DateTime', icon: Calendar },
        { value: 'text', label: 'Text', icon: FileText },
        { value: 'json', label: 'JSON', icon: Code },
    ] as const;

    const createTable = () => {
        if (!newTableName.trim()) return;

        const newTable: Table = {
            id: `table_${Date.now()}`,
            name: newTableName,
            position: { x: 50 + tables.length * 30, y: 50 + tables.length * 30 },
            fields: [
                {
                    id: `field_${Date.now()}_id`,
                    name: 'id',
                    type: 'string',
                    isPrimary: true,
                    isRequired: true,
                    isUnique: true,
                },
            ],
        };

        setTables([...tables, newTable]);
        setNewTableName('');
        setShowAddTable(false);
        setSelectedTable(newTable.id);
    };

    const addField = (tableId: string) => {
        setTables(tables.map(table => {
            if (table.id === tableId) {
                return {
                    ...table,
                    fields: [
                        ...table.fields,
                        {
                            id: `field_${Date.now()}`,
                            name: `field${table.fields.length}`,
                            type: 'string',
                            isRequired: false,
                        },
                    ],
                };
            }
            return table;
        }));
    };

    const updateField = (tableId: string, fieldId: string, updates: Partial<Field>) => {
        setTables(tables.map(table => {
            if (table.id === tableId) {
                return {
                    ...table,
                    fields: table.fields.map(field =>
                        field.id === fieldId ? { ...field, ...updates } : field
                    ),
                };
            }
            return table;
        }));
    };

    const deleteField = (tableId: string, fieldId: string) => {
        setTables(tables.map(table => {
            if (table.id === tableId) {
                return {
                    ...table,
                    fields: table.fields.filter(field => field.id !== fieldId && !field.isPrimary),
                };
            }
            return table;
        }));
    };

    const deleteTable = (tableId: string) => {
        setTables(tables.filter(t => t.id !== tableId));
        setRelations(relations.filter(r => r.from.tableId !== tableId && r.to.tableId !== tableId));
        if (selectedTable === tableId) setSelectedTable(null);
    };

    const generateMermaidCode = () => {
        if (tables.length === 0) return '';
        let code = 'erDiagram\n';
        tables.forEach(table => {
            code += `    ${table.name.toUpperCase()} {\n`;
            table.fields.forEach(field => {
                const typeMap: Record<string, string> = {
                    string: 'string',
                    number: 'int',
                    boolean: 'bool',
                    datetime: 'date',
                    text: 'string',
                    json: 'json',
                };
                code += `        ${typeMap[field.type] || 'string'} ${field.name}${field.isPrimary ? ' PK' : ''}\n`;
            });
            code += '    }\n';
        });

        relations.forEach(rel => {
            const fromTable = tables.find(t => t.id === rel.from.tableId);
            const toTable = tables.find(t => t.id === rel.to.tableId);
            if (fromTable && toTable) {
                const link = rel.type === 'one-to-many' ? '||--o{' : rel.type === 'one-to-one' ? '||--||' : '}o--o{';
                code += `    ${fromTable.name.toUpperCase()} ${link} ${toTable.name.toUpperCase()} : ""\n`;
            }
        });

        return code;
    };

    const generatePrismaSchema = () => {
        let schema = 'generator client {\n  provider = "prisma-client-js"\n}\n\n';
        schema += 'datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\n';

        tables.forEach(table => {
            schema += `model ${table.name.charAt(0).toUpperCase() + table.name.slice(1)} {\n`;
            table.fields.forEach(field => {
                const typeMap: Record<string, string> = {
                    string: 'String',
                    number: 'Int',
                    boolean: 'Boolean',
                    datetime: 'DateTime',
                    text: 'String',
                    json: 'Json',
                };
                const prismaType = typeMap[field.type] || 'String';
                const modifiers = [];
                if (field.isPrimary) modifiers.push('@id @default(cuid())');
                if (field.isUnique && !field.isPrimary) modifiers.push('@unique');
                if (!field.isRequired && !field.isPrimary) modifiers.push('?');
                schema += `  ${field.name} ${prismaType}${field.isRequired || field.isPrimary ? '' : '?'} ${modifiers.join(' ')}\n`;
            });
            schema += '}\n\n';
        });

        return schema;
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const selectedTableData = tables.find(t => t.id === selectedTable);

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-zinc-900/50 border border-white/10 rounded-2xl p-2 px-4 shadow-lg shadow-black/20">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setView('canvas')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${view === 'canvas' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Box className="w-4 h-4" />
                        Canvas
                    </button>
                    <button
                        onClick={() => setView('diagram')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${view === 'diagram' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Eye className="w-4 h-4" />
                        Live Diagram
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <button
                        onClick={() => setShowAddTable(true)}
                        className="px-4 py-2 bg-white text-black hover:bg-zinc-200 text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-white/5"
                    >
                        <Plus className="w-4 h-4" />
                        Add Table
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Main View Area */}
                <div className="flex-1 bg-zinc-900/30 border border-white/10 rounded-2xl relative overflow-hidden flex flex-col shadow-2xl">
                    <div className="flex-1 overflow-auto p-6 relative">
                        {tables.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center">
                                    <div className="inline-flex p-4 bg-blue-500/10 rounded-2xl mb-4">
                                        <Database className="w-12 h-12 text-blue-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Design Your Database</h3>
                                    <p className="text-zinc-400 mb-6">Create tables and define relationships visually</p>
                                    <button
                                        onClick={() => setShowAddTable(true)}
                                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 mx-auto"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Create First Table
                                    </button>
                                </div>
                            </div>
                        ) : view === 'canvas' ? (
                            <div className="min-w-max min-h-max relative">
                                {tables.map(table => (
                                    <div
                                        key={table.id}
                                        style={{
                                            position: 'absolute',
                                            left: table.position.x,
                                            top: table.position.y,
                                        }}
                                        className={`bg-zinc-800 border-2 rounded-xl overflow-hidden min-w-[280px] transition-all cursor-pointer ${selectedTable === table.id
                                            ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                                            : 'border-white/10 hover:border-white/20'
                                            }`}
                                        onClick={() => setSelectedTable(table.id)}
                                    >
                                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Database className="w-4 h-4 text-white" />
                                                <h4 className="font-bold text-white">{table.name}</h4>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteTable(table.id);
                                                }}
                                                className="p-1 rounded hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="p-3 space-y-1">
                                            {table.fields.map(field => (
                                                <div
                                                    key={field.id}
                                                    className="flex items-center gap-2 text-sm py-1.5 px-2 rounded hover:bg-white/5"
                                                >
                                                    {field.isPrimary && <Key className="w-3 h-3 text-yellow-400" />}
                                                    <span className={`flex-1 ${field.isPrimary ? 'text-yellow-400 font-bold' : 'text-white'}`}>
                                                        {field.name}
                                                    </span>
                                                    <span className="text-xs text-zinc-400 font-mono">{field.type}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full w-full">
                                <MermaidChart chart={generateMermaidCode()} />
                            </div>
                        )}
                    </div>

                    {/* Floating Add Button */}
                    {tables.length > 0 && (
                        <button
                            onClick={() => setShowAddTable(true)}
                            className="fixed bottom-8 right-8 p-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full shadow-2xl shadow-blue-500/30 transition-all hover:scale-110"
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                    )}
                </div>

                {/* Properties Panel */}
                <div className="w-96 space-y-4">
                    {/* Schema Export */}
                    <div className="bg-zinc-900/30 border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Code className="w-4 h-4 text-emerald-400" />
                                Export Schema
                            </h3>
                            <button
                                onClick={() => copyToClipboard(generatePrismaSchema())}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg font-medium transition-colors"
                            >
                                <Download className="w-3 h-3 inline mr-1" />
                                Copy Prisma
                            </button>
                        </div>
                        <div className="bg-black/50 border border-white/5 rounded-lg p-3 max-h-40 overflow-auto">
                            <pre className="text-[10px] text-zinc-400 font-mono whitespace-pre-wrap">
                                {generatePrismaSchema()}
                            </pre>
                        </div>
                    </div>

                    {/* Table Editor */}
                    {selectedTableData && (
                        <div className="bg-zinc-900/30 border border-white/10 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-white">Edit {selectedTableData.name}</h3>
                                <button
                                    onClick={() => addField(selectedTableData.id)}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg font-medium transition-colors flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" />
                                    Field
                                </button>
                            </div>

                            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                                {selectedTableData.fields.map(field => (
                                    <div key={field.id} className="bg-black/30 border border-white/5 rounded-lg p-3 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={field.name}
                                                onChange={(e) => updateField(selectedTableData.id, field.id, { name: e.target.value })}
                                                disabled={field.isPrimary}
                                                className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm disabled:opacity-50"
                                            />
                                            {!field.isPrimary && (
                                                <button
                                                    onClick={() => deleteField(selectedTableData.id, field.id)}
                                                    className="p-1 rounded hover:bg-red-500/20 text-red-400"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        <select
                                            value={field.type}
                                            onChange={(e) => updateField(selectedTableData.id, field.id, { type: e.target.value as Field['type'] })}
                                            disabled={field.isPrimary}
                                            className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs disabled:opacity-50"
                                        >
                                            {fieldTypes.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>

                                        {!field.isPrimary && (
                                            <div className="flex gap-2 text-xs">
                                                <label className="flex items-center gap-1.5 text-zinc-400 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={field.isRequired || false}
                                                        onChange={(e) => updateField(selectedTableData.id, field.id, { isRequired: e.target.checked })}
                                                        className="rounded"
                                                    />
                                                    Required
                                                </label>
                                                <label className="flex items-center gap-1.5 text-zinc-400 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={field.isUnique || false}
                                                        onChange={(e) => updateField(selectedTableData.id, field.id, { isUnique: e.target.checked })}
                                                        className="rounded"
                                                    />
                                                    Unique
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Add Table Modal */}
                {showAddTable && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-bold text-white mb-4">Create New Table</h3>
                            <input
                                type="text"
                                value={newTableName}
                                onChange={(e) => setNewTableName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && createTable()}
                                placeholder="Table name (e.g., users, posts)"
                                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-400 mb-4"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowAddTable(false);
                                        setNewTableName('');
                                    }}
                                    className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createTable}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArchitectureTab;
