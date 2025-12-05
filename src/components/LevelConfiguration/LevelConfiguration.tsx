import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, Table, Button, Input, IconButton } from '@mui/joy';
import axios from 'axios';
import { API_BASE_URL } from '../../config/environment';

interface Level {
    id: number;
    streamerId: string;
    levelNumber: number;
    levelName: string;
    requiredPoints: number;
}

interface LevelConfigProps {
    streamerId: string;
    darkMode: boolean;
}

export default function LevelConfiguration({ streamerId, darkMode }: LevelConfigProps) {
    const [levels, setLevels] = useState<Level[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ levelName: '', requiredPoints: 0 });
    const [newLevel, setNewLevel] = useState({ levelNumber: 0, levelName: '', requiredPoints: 0 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchLevels();
    }, [streamerId]);

    const fetchLevels = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/streamers/${streamerId}/levels`);
            setLevels(response.data);
            if (response.data.length > 0) {
                const maxLevel = Math.max(...response.data.map((l: Level) => l.levelNumber));
                setNewLevel(prev => ({ ...prev, levelNumber: maxLevel + 1 }));
            } else {
                setNewLevel(prev => ({ ...prev, levelNumber: 1 }));
            }
        } catch (error) {
            console.error('Error fetching levels:', error);
        }
    };

    const handleEdit = (level: Level) => {
        setEditingId(level.id);
        setEditForm({ levelName: level.levelName, requiredPoints: level.requiredPoints });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({ levelName: '', requiredPoints: 0 });
    };

    const handleSaveEdit = async (levelId: number) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            await axios.put(
                `${API_BASE_URL}/api/streamers/${streamerId}/levels/${levelId}`,
                editForm,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchLevels();
            setEditingId(null);
        } catch (error) {
            console.error('Error updating level:', error);
            alert('Error al actualizar el nivel');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (levelId: number) => {
        if (!window.confirm('¿Estás seguro de eliminar este nivel?')) return;
        
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            await axios.delete(
                `${API_BASE_URL}/api/streamers/${streamerId}/levels/${levelId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchLevels();
        } catch (error) {
            console.error('Error deleting level:', error);
            alert('Error al eliminar el nivel');
        } finally {
            setLoading(false);
        }
    };

    const handleAddLevel = async () => {
        if (!newLevel.levelName || newLevel.requiredPoints < 0) {
            alert('Por favor completa todos los campos');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            await axios.post(
                `${API_BASE_URL}/api/streamers/${streamerId}/levels`,
                newLevel,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchLevels();
            setNewLevel({ levelNumber: newLevel.levelNumber + 1, levelName: '', requiredPoints: 0 });
        } catch (error: any) {
            console.error('Error adding level:', error);
            if (error.response?.status === 409) {
                alert('Este nivel ya existe');
            } else {
                alert('Error al agregar el nivel');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card variant="outlined" className="floating-card" sx={{ 
            p: 2, 
            mb: 3,
            bgcolor: darkMode ? '#1e293b' : 'white', 
            borderColor: darkMode ? '#334155' : '#e0e0e0' 
        }}>
            <Typography level="h4" sx={{ mb: 2, fontWeight: 'lg', color: darkMode ? 'white' : 'inherit' }}>
                ⚙️ Configuración de Niveles
            </Typography>
            <Typography level="body-sm" sx={{ mb: 2, color: darkMode ? '#cbd5e1' : '#64748b' }}>
                Configura los puntos necesarios para cada nivel de tus espectadores
            </Typography>
            
            <Table variant="plain" aria-label="level-config">
                <thead>
                    <tr>
                        <th><Typography level="body-sm" sx={{ color: darkMode ? 'black' : 'inherit' }}>Nivel</Typography></th>
                        <th><Typography level="body-sm" sx={{ color: darkMode ? 'black' : 'inherit' }}>Nombre</Typography></th>
                        <th><Typography level="body-sm" sx={{ color: darkMode ? 'black' : 'inherit' }}>Puntos Requeridos</Typography></th>
                        <th><Typography level="body-sm" sx={{ color: darkMode ? 'black' : 'inherit' }}>Acciones</Typography></th>
                    </tr>
                </thead>
                <tbody>
                    {levels.map((level) => (
                        <tr key={level.id}>
                            <td>
                                <Typography level="body-md" sx={{ color: darkMode ? '#e2e8f0' : 'inherit' }}>
                                    {level.levelNumber}
                                </Typography>
                            </td>
                            <td>
                                {editingId === level.id ? (
                                    <Input
                                        size="sm"
                                        value={editForm.levelName}
                                        onChange={(e) => setEditForm({ ...editForm, levelName: e.target.value })}
                                    />
                                ) : (
                                    <Typography level="body-md" sx={{ color: darkMode ? '#e2e8f0' : 'inherit' }}>
                                        {level.levelName}
                                    </Typography>
                                )}
                            </td>
                            <td>
                                {editingId === level.id ? (
                                    <Input
                                        size="sm"
                                        type="number"
                                        value={editForm.requiredPoints}
                                        onChange={(e) => setEditForm({ ...editForm, requiredPoints: Number(e.target.value) })}
                                    />
                                ) : (
                                    <Typography level="body-md" sx={{ color: darkMode ? '#e2e8f0' : 'inherit' }}>
                                        {level.requiredPoints}
                                    </Typography>
                                )}
                            </td>
                            <td>
                                {editingId === level.id ? (
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button 
                                            size="sm" 
                                            variant="solid" 
                                            color="success" 
                                            onClick={() => handleSaveEdit(level.id)}
                                            disabled={loading}
                                        >
                                            Guardar
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outlined" 
                                            onClick={handleCancelEdit}
                                            disabled={loading}
                                        >
                                            Cancelar
                                        </Button>
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button 
                                            size="sm" 
                                            variant="soft" 
                                            onClick={() => handleEdit(level)}
                                            disabled={loading}
                                        >
                                            Editar
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="solid" 
                                            color="danger" 
                                            onClick={() => handleDelete(level.id)}
                                            disabled={loading}
                                        >
                                            Eliminar
                                        </Button>
                                    </Box>
                                )}
                            </td>
                        </tr>
                    ))}
                    <tr>
                        <td>
                            <Input
                                size="sm"
                                type="number"
                                value={newLevel.levelNumber}
                                onChange={(e) => setNewLevel({ ...newLevel, levelNumber: Number(e.target.value) })}
                                disabled={loading}
                            />
                        </td>
                        <td>
                            <Input
                                size="sm"
                                placeholder="Nombre del nivel"
                                value={newLevel.levelName}
                                onChange={(e) => setNewLevel({ ...newLevel, levelName: e.target.value })}
                                disabled={loading}
                            />
                        </td>
                        <td>
                            <Input
                                size="sm"
                                type="number"
                                placeholder="Puntos"
                                value={newLevel.requiredPoints}
                                onChange={(e) => setNewLevel({ ...newLevel, requiredPoints: Number(e.target.value) })}
                                disabled={loading}
                            />
                        </td>
                        <td>
                            <Button 
                                size="sm" 
                                variant="solid" 
                                color="success" 
                                onClick={handleAddLevel}
                                disabled={loading}
                            >
                                Agregar
                            </Button>
                        </td>
                    </tr>
                </tbody>
            </Table>
        </Card>
    );
}
