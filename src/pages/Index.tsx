import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API = {
  auth: 'https://functions.poehali.dev/2bd41eec-d707-4ea0-b6c3-a27e34ea7426',
  schedule: 'https://functions.poehali.dev/c4ca2d02-3180-41b7-b275-4bdd0b1bc57c',
  students: 'https://functions.poehali.dev/dd6e389e-d8ff-4db7-81fa-a08cae762011',
  subjects: 'https://functions.poehali.dev/23625e02-9283-47f9-b147-bf10a36eff63',
  school: 'https://functions.poehali.dev/32e5b8ba-6e8a-4e51-afef-0e53a4e7daf6'
};

interface User {
  id: number;
  email: string;
  role: 'admin' | 'student';
  full_name?: string;
}

interface Schedule {
  id: number;
  day_of_week: string;
  time_start: string;
  time_end: string;
  subject: string;
  subject_id?: number;
  subject_name?: string;
  subject_color?: string;
  teacher: string;
  notes?: string;
  lesson_date?: string;
}

interface Subject {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

interface Student {
  id: number;
  email: string;
  full_name?: string;
}

interface Homework {
  id: number;
  subject_id: number;
  subject_name?: string;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
}

const DAYS = [
  { value: 'monday', label: 'Понедельник' },
  { value: 'tuesday', label: 'Вторник' },
  { value: 'wednesday', label: 'Среда' },
  { value: 'thursday', label: 'Четверг' },
  { value: 'friday', label: 'Пятница' },
  { value: 'saturday', label: 'Суббота' },
  { value: 'sunday', label: 'Воскресенье' }
];

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [isHomeworkDialogOpen, setIsHomeworkDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [showOnlyUpcoming, setShowOnlyUpcoming] = useState(true);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');
  const { toast } = useToast();

  const [scheduleForm, setScheduleForm] = useState({
    day_of_week: 'monday',
    time_start: '',
    time_end: '',
    subject: '',
    subject_id: '',
    teacher: '',
    notes: '',
    lesson_date: ''
  });

  const [studentForm, setStudentForm] = useState({
    email: '',
    password: '',
    full_name: ''
  });

  const [subjectForm, setSubjectForm] = useState({
    name: '',
    color: '#3b82f6'
  });

  const [homeworkForm, setHomeworkForm] = useState({
    subject_id: '',
    title: '',
    description: '',
    due_date: ''
  });

  useEffect(() => {
    if (user) {
      loadSchedules();
      loadSubjects();
      loadHomeworks();
      if (user.role === 'admin') {
        loadStudents();
      }
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(API.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        toast({ title: 'Вход выполнен!', description: `Добро пожаловать, ${data.user.email}` });
      } else {
        toast({ title: 'Ошибка', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось войти', variant: 'destructive' });
    }
  };

  const loadSchedules = async () => {
    try {
      const response = await fetch(API.schedule);
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (error) {
      console.error('Failed to load schedules', error);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await fetch(API.students);
      const data = await response.json();
      setStudents(data.students || []);
    } catch (error) {
      console.error('Failed to load students', error);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await fetch(API.subjects);
      const data = await response.json();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load subjects', error);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      const response = await fetch(API.schedule, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleForm)
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Успешно!', description: 'Расписание создано' });
        loadSchedules();
        setIsScheduleDialogOpen(false);
        setScheduleForm({ day_of_week: 'monday', time_start: '', time_end: '', subject: '', subject_id: '', teacher: '', notes: '', lesson_date: '' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать расписание', variant: 'destructive' });
    }
  };

  const handleUpdateSchedule = async () => {
    if (!editingSchedule) return;
    try {
      const response = await fetch(API.schedule, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...scheduleForm, id: editingSchedule.id })
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Успешно!', description: 'Расписание обновлено' });
        loadSchedules();
        setIsScheduleDialogOpen(false);
        setEditingSchedule(null);
        setScheduleForm({ day_of_week: 'monday', time_start: '', time_end: '', subject: '', subject_id: '', teacher: '', notes: '', lesson_date: '' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить расписание', variant: 'destructive' });
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    try {
      const response = await fetch(`${API.schedule}?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Успешно!', description: 'Расписание удалено' });
        loadSchedules();
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить расписание', variant: 'destructive' });
    }
  };

  const handleCreateStudent = async () => {
    try {
      const response = await fetch(API.students, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentForm)
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Успешно!', description: 'Ученик создан' });
        loadStudents();
        setIsStudentDialogOpen(false);
        setStudentForm({ email: '', password: '', full_name: '' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать ученика', variant: 'destructive' });
    }
  };

  const handleDeleteStudent = async (id: number) => {
    try {
      const response = await fetch(`${API.students}?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Успешно!', description: 'Ученик удален' });
        loadStudents();
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить ученика', variant: 'destructive' });
    }
  };

  const handleCreateSubject = async () => {
    try {
      const response = await fetch(API.subjects, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subjectForm)
      });
      const data = await response.json();
      if (data.id) {
        toast({ title: 'Успешно!', description: 'Предмет создан' });
        loadSubjects();
        setIsSubjectDialogOpen(false);
        setSubjectForm({ name: '', color: '#3b82f6' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать предмет', variant: 'destructive' });
    }
  };

  const handleUpdateSubject = async () => {
    if (!editingSubject) return;
    try {
      const response = await fetch(API.subjects, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...subjectForm, id: editingSubject.id })
      });
      const data = await response.json();
      if (data.id) {
        toast({ title: 'Успешно!', description: 'Предмет обновлен' });
        loadSubjects();
        setIsSubjectDialogOpen(false);
        setEditingSubject(null);
        setSubjectForm({ name: '', color: '#3b82f6' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить предмет', variant: 'destructive' });
    }
  };

  const handleDeleteSubject = async (id: number) => {
    try {
      const response = await fetch(`${API.subjects}?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Успешно!', description: 'Предмет удален' });
        loadSubjects();
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить предмет', variant: 'destructive' });
    }
  };

  const loadHomeworks = async () => {
    try {
      const response = await fetch(`${API.school}?entity=homework`);
      const data = await response.json();
      setHomeworks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load homeworks', error);
    }
  };

  const handleCreateHomework = async () => {
    try {
      const response = await fetch(`${API.school}?entity=homework`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(homeworkForm)
      });
      const data = await response.json();
      if (data.id) {
        toast({ title: 'Успешно!', description: 'Домашнее задание создано' });
        loadHomeworks();
        setIsHomeworkDialogOpen(false);
        setHomeworkForm({ subject_id: '', title: '', description: '', due_date: '' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать ДЗ', variant: 'destructive' });
    }
  };

  const handleDeleteHomework = async (id: number) => {
    try {
      const response = await fetch(`${API.school}?entity=homework&id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Успешно!', description: 'Домашнее задание удалено' });
        loadHomeworks();
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить ДЗ', variant: 'destructive' });
    }
  };

  const openEditDialog = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      day_of_week: schedule.day_of_week,
      time_start: schedule.time_start,
      time_end: schedule.time_end,
      subject: schedule.subject,
      subject_id: schedule.subject_id?.toString() || '',
      teacher: schedule.teacher,
      notes: schedule.notes || '',
      lesson_date: schedule.lesson_date || ''
    });
    setIsScheduleDialogOpen(true);
  };

  const openEditSubjectDialog = (subject: Subject) => {
    setEditingSubject(subject);
    setSubjectForm({
      name: subject.name,
      color: subject.color
    });
    setIsSubjectDialogOpen(true);
  };

  const getFilteredSchedules = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return schedules.filter(schedule => {
      if (selectedDateFilter) {
        const filterDate = new Date(selectedDateFilter);
        filterDate.setHours(0, 0, 0, 0);
        
        if (user?.role === 'student') {
          const dayOfWeek = filterDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          if (schedule.day_of_week !== dayOfWeek) {
            return false;
          }
        }
        
        if (schedule.lesson_date) {
          const lessonDate = new Date(schedule.lesson_date);
          lessonDate.setHours(0, 0, 0, 0);
          return lessonDate.getTime() === filterDate.getTime();
        }
        
        if (user?.role === 'student') {
          return true;
        }
        
        return false;
      }

      if (user?.role === 'student') {
        return false;
      }

      if (showOnlyUpcoming && schedule.lesson_date) {
        const lessonDate = new Date(schedule.lesson_date);
        lessonDate.setHours(0, 0, 0, 0);
        return lessonDate >= today;
      }

      return true;
    });
  };

  const groupedSchedules = getFilteredSchedules().reduce((acc, schedule) => {
    const day = schedule.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(schedule);
    return acc;
  }, {} as Record<string, Schedule[]>);

  if (!user) {
    return (
      <div className="min-h-screen from-primary via-secondary to-accent flex items-center justify-center p-4 bg-slate-50">
        <Card className="w-full max-w-md shadow-2xl animate-scale-in">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-4">
              <Icon name="GraduationCap" size={32} className="text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Расписание "МБОУ Лицей №22"</CardTitle>
            <CardDescription>Вход в систему</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Логин/Email</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="Введите email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="transition-all focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="transition-all focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all">
                <Icon name="LogIn" size={18} className="mr-2" />
                Войти
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-orange-50">
      <header className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Icon name="GraduationCap" size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Расписание "Лицей №22"</h1>
              <p className="text-sm text-muted-foreground">{user.role === 'admin' ? 'Администратор + Учитель' : 'Панель ученика'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-semibold">{user.full_name || user.email}</p>
              <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
            </div>
            <Button variant="outline" onClick={() => setUser(null)} className="hover:bg-destructive hover:text-white transition-all">
              <Icon name="LogOut" size={18} className="mr-2" />
              Выход
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {user.role === 'admin' && (
          <div className="mb-8 flex flex-wrap gap-4">
            <Dialog open={isScheduleDialogOpen} onOpenChange={(open) => {
              setIsScheduleDialogOpen(open);
              if (!open) {
                setEditingSchedule(null);
                setScheduleForm({ day_of_week: 'monday', time_start: '', time_end: '', subject: '', subject_id: '', teacher: '', notes: '', lesson_date: '' });
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-lg">
                  <Icon name="Plus" size={18} className="mr-2" />
                  Добавить расписание
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingSchedule ? 'Редактировать расписание' : 'Создать расписание'}</DialogTitle>
                  <DialogDescription>Заполните информацию о занятии</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>День недели</Label>
                    <Select value={scheduleForm.day_of_week} onValueChange={(value) => setScheduleForm({ ...scheduleForm, day_of_week: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map(day => (
                          <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Время начала</Label>
                      <Input
                        type="time"
                        value={scheduleForm.time_start}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, time_start: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Время окончания</Label>
                      <Input
                        type="time"
                        value={scheduleForm.time_end}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, time_end: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Предмет</Label>
                    <Select 
                      value={scheduleForm.subject_id} 
                      onValueChange={(value) => {
                        const subject = subjects.find(s => s.id.toString() === value);
                        setScheduleForm({ 
                          ...scheduleForm, 
                          subject_id: value,
                          subject: subject?.name || ''
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите предмет" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(subject => (
                          <SelectItem key={subject.id} value={subject.id.toString()}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }}></div>
                              {subject.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Преподаватель</Label>
                    <Input
                      placeholder="ФИО преподавателя"
                      value={scheduleForm.teacher}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, teacher: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Дата занятия (необязательно)</Label>
                    <Input
                      type="date"
                      value={scheduleForm.lesson_date}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, lesson_date: e.target.value })}
                      placeholder="Укажите конкретную дату"
                    />
                    <p className="text-xs text-muted-foreground">Оставьте пустым для регулярного занятия по дню недели</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Примечания</Label>
                    <Textarea
                      placeholder="Дополнительная информация"
                      value={scheduleForm.notes}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                    />
                  </div>
                  <Button
                    onClick={editingSchedule ? handleUpdateSchedule : handleCreateSchedule}
                    className="w-full bg-gradient-to-r from-primary to-secondary"
                  >
                    {editingSchedule ? 'Сохранить изменения' : 'Создать'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isSubjectDialogOpen} onOpenChange={(open) => {
              setIsSubjectDialogOpen(open);
              if (!open) {
                setEditingSubject(null);
                setSubjectForm({ name: '', color: '#3b82f6' });
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-500 to-teal-500 hover:opacity-90 transition-all shadow-lg">
                  <Icon name="BookOpen" size={18} className="mr-2" />
                  Управление предметами
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Управление предметами</DialogTitle>
                  <DialogDescription>Создавайте и редактируйте школьные предметы</DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                    <h3 className="font-semibold text-lg">{editingSubject ? 'Редактировать предмет' : 'Создать новый предмет'}</h3>
                    <div className="space-y-2">
                      <Label>Название предмета</Label>
                      <Input
                        placeholder="Например: Математика"
                        value={subjectForm.name}
                        onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Цвет</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="color"
                          value={subjectForm.color}
                          onChange={(e) => setSubjectForm({ ...subjectForm, color: e.target.value })}
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={subjectForm.color}
                          onChange={(e) => setSubjectForm({ ...subjectForm, color: e.target.value })}
                          placeholder="#3b82f6"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={editingSubject ? handleUpdateSubject : handleCreateSubject}
                      className="w-full bg-gradient-to-r from-green-500 to-teal-500"
                    >
                      {editingSubject ? 'Сохранить изменения' : 'Создать предмет'}
                    </Button>
                    {editingSubject && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingSubject(null);
                          setSubjectForm({ name: '', color: '#3b82f6' });
                        }}
                        className="w-full"
                      >
                        Отменить редактирование
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Список предметов ({subjects.length})</h3>
                    <div className="grid gap-2 max-h-96 overflow-y-auto">
                      {subjects.map((subject) => (
                        <Card key={subject.id} className="animate-fade-in">
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-6 h-6 rounded-full shadow-md" 
                                style={{ backgroundColor: subject.color }}
                              ></div>
                              <div>
                                <p className="font-medium">{subject.name}</p>
                                <p className="text-xs text-muted-foreground">{subject.color}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditSubjectDialog(subject)}
                              >
                                <Icon name="Edit" size={16} />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteSubject(subject.id)}
                              >
                                <Icon name="Trash2" size={16} />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {subjects.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">Предметы пока не созданы</p>
                      )}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-secondary to-accent hover:opacity-90 transition-all shadow-lg">Добавить класс</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать ученика</DialogTitle>
                  <DialogDescription>Введите данные нового ученика</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      placeholder="student@example.com"
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Пароль</Label>
                    <Input
                      type="password"
                      placeholder="Пароль для входа"
                      value={studentForm.password}
                      onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ФИО</Label>
                    <Input
                      placeholder="Полное имя"
                      value={studentForm.full_name}
                      onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleCreateStudent} className="w-full bg-gradient-to-r from-secondary to-accent">
                    Создать
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isHomeworkDialogOpen} onOpenChange={(open) => {
              setIsHomeworkDialogOpen(open);
              if (!open) setHomeworkForm({ subject_id: '', title: '', description: '', due_date: '' });
            }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-500 to-teal-600 hover:opacity-90 transition-all shadow-lg">
                  <Icon name="BookOpen" size={18} className="mr-2" />
                  Добавить ДЗ
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать домашнее задание</DialogTitle>
                  <DialogDescription>Укажите предмет, описание и срок сдачи</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Предмет</Label>
                    <Select value={homeworkForm.subject_id} onValueChange={(value) => setHomeworkForm({ ...homeworkForm, subject_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите предмет" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(subject => (
                          <SelectItem key={subject.id} value={subject.id.toString()}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }}></div>
                              {subject.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Название</Label>
                    <Input
                      placeholder="Например: Параграф 15, упражнения 1-5"
                      value={homeworkForm.title}
                      onChange={(e) => setHomeworkForm({ ...homeworkForm, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Описание</Label>
                    <Textarea
                      placeholder="Детальное описание задания"
                      value={homeworkForm.description}
                      onChange={(e) => setHomeworkForm({ ...homeworkForm, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Срок сдачи</Label>
                    <Input
                      type="date"
                      value={homeworkForm.due_date}
                      onChange={(e) => setHomeworkForm({ ...homeworkForm, due_date: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleCreateHomework} className="w-full bg-gradient-to-r from-green-500 to-teal-600">
                    Создать ДЗ
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Icon name="Calendar" size={32} className="text-primary" />
                Расписание занятий
              </h2>
              
              {user.role === 'admin' ? (
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm">
                    <input
                      type="checkbox"
                      id="upcoming-filter"
                      checked={showOnlyUpcoming}
                      onChange={(e) => {
                        setShowOnlyUpcoming(e.target.checked);
                        if (e.target.checked) setSelectedDateFilter('');
                      }}
                      className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor="upcoming-filter" className="text-sm font-medium cursor-pointer whitespace-nowrap">
                      Только актуальные
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm">
                    <Icon name="Search" size={16} className="text-muted-foreground" />
                    <Input
                      type="date"
                      value={selectedDateFilter}
                      onChange={(e) => {
                        setSelectedDateFilter(e.target.value);
                        if (e.target.value) setShowOnlyUpcoming(false);
                      }}
                      className="border-0 h-auto p-0 focus-visible:ring-0 text-sm w-36"
                      placeholder="Фильтр по дате"
                    />
                    {selectedDateFilter && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedDateFilter('')}
                        className="h-5 w-5 p-0"
                      >
                        <Icon name="X" size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm">
                  <Icon name="Calendar" size={16} className="text-muted-foreground" />
                  <Input
                    type="date"
                    value={selectedDateFilter}
                    onChange={(e) => setSelectedDateFilter(e.target.value)}
                    className="border-0 h-auto p-0 focus-visible:ring-0 text-sm w-36"
                    placeholder="Выберите дату"
                  />
                  {selectedDateFilter && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedDateFilter('')}
                      className="h-5 w-5 p-0"
                    >
                      <Icon name="X" size={14} />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {Object.keys(groupedSchedules).length === 0 && (
              <Card className="shadow-lg">
                <CardContent className="py-12 text-center">
                  <Icon name="CalendarOff" size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">
                    {user.role === 'student' && !selectedDateFilter 
                      ? 'Выберите дату в календаре, чтобы увидеть расписание' 
                      : selectedDateFilter 
                        ? 'На выбранную дату занятий не найдено' 
                        : showOnlyUpcoming 
                          ? 'Актуальных занятий не найдено' 
                          : 'Расписание пусто'}
                  </p>
                </CardContent>
              </Card>
            )}

            {DAYS.map(day => {
              const daySchedules = groupedSchedules[day.value] || [];
              if (daySchedules.length === 0) return null;

              return (
                <Card key={day.value} className="shadow-lg hover:shadow-xl transition-all animate-fade-in">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="CalendarDays" size={24} className="text-primary" />
                      {day.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {daySchedules.map(schedule => (
                      <div key={schedule.id} className="p-4 border rounded-lg hover:border-primary transition-all hover:shadow-md bg-gradient-to-r from-white to-purple-50/30">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Icon name="Clock" size={18} className="text-secondary" />
                              <span className="font-semibold text-lg">
                                {schedule.time_start} - {schedule.time_end}
                              </span>
                            </div>
                            {schedule.lesson_date && (
                              <div className="flex items-center gap-2 text-sm text-orange-600 font-medium">
                                <Icon name="CalendarDays" size={14} />
                                <span>{new Date(schedule.lesson_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                              </div>
                            )}
                          </div>
                          {user.role === 'admin' && (
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => openEditDialog(schedule)} className="hover:bg-primary hover:text-white">
                                <Icon name="Pencil" size={16} />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDeleteSchedule(schedule.id)} className="hover:bg-destructive hover:text-white">
                                <Icon name="Trash2" size={16} />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          {schedule.subject_color && (
                            <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: schedule.subject_color }}></div>
                          )}
                          <h4 className="font-bold text-xl text-primary">{schedule.subject_name || schedule.subject}</h4>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <Icon name="User" size={16} />
                          <span>{schedule.teacher}</span>
                        </div>
                        {schedule.notes && (
                          <div className="mt-3 p-3 bg-accent/10 rounded-md">
                            <div className="flex items-start gap-2">
                              <Icon name="StickyNote" size={16} className="text-accent mt-1" />
                              <p className="text-sm">{schedule.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}

            {schedules.length === 0 && (
              <Card className="shadow-lg">
                <CardContent className="py-12 text-center">
                  <Icon name="Calendar" size={64} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg">Расписание пока не создано</p>
                </CardContent>
              </Card>
            )}
          </div>

          {user.role === 'admin' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold flex items-center gap-3">Классы</h2>
              <Card className="shadow-lg">
                <CardContent className="pt-6 space-y-3">
                  {students.map(student => (
                    <div key={student.id} className="flex justify-between items-center p-3 border rounded-lg hover:border-secondary transition-all hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center">
                          <Icon name="User" size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">{student.full_name || student.email}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStudent(student.id)}
                        className="hover:bg-destructive hover:text-white"
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  ))}
                  {students.length === 0 && (
                    <div className="text-center py-8">
                      <Icon name="Users" size={48} className="mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">Нет учеников</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <h2 className="text-3xl font-bold flex items-center gap-3 mt-8">
                <Icon name="BookOpen" size={32} className="text-green-600" />
                Домашние задания
              </h2>
              <Card className="shadow-lg">
                <CardContent className="pt-6 space-y-3">
                  {homeworks.map(hw => (
                    <div key={hw.id} className="p-4 border rounded-lg hover:border-green-500 transition-all hover:shadow-md bg-gradient-to-r from-white to-green-50/30">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-green-700">{hw.title}</h4>
                          <p className="text-sm text-muted-foreground">{hw.subject_name}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteHomework(hw.id)}
                          className="hover:bg-destructive hover:text-white"
                        >
                          <Icon name="Trash2" size={16} />
                        </Button>
                      </div>
                      <p className="text-sm mb-2">{hw.description}</p>
                      <div className="flex items-center gap-2 text-sm text-orange-600 font-medium">
                        <Icon name="Clock" size={14} />
                        Сдать до: {new Date(hw.due_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  ))}
                  {homeworks.length === 0 && (
                    <div className="text-center py-8">
                      <Icon name="BookOpen" size={48} className="mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">Домашние задания не созданы</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}