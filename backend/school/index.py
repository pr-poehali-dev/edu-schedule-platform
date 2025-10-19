import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Универсальный API для школьной системы - классы, учителя, ДЗ, оценки
    Args: event с httpMethod, body, queryStringParameters, path
    Returns: HTTP response с данными
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor()
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    try:
        params = event.get('queryStringParameters', {}) or {}
        entity = params.get('entity', 'classes')
        
        if entity == 'classes':
            return handle_classes(method, event, cursor, conn, headers)
        elif entity == 'teachers':
            return handle_teachers(method, event, cursor, conn, headers)
        elif entity == 'homework':
            return handle_homework(method, event, cursor, conn, headers)
        elif entity == 'grades':
            return handle_grades(method, event, cursor, conn, headers)
        
    finally:
        cursor.close()
        conn.close()
    
    return {
        'statusCode': 400,
        'headers': headers,
        'body': json.dumps({'error': 'Unknown entity'})
    }


def handle_classes(method, event, cursor, conn, headers):
    if method == 'GET':
        cursor.execute('''
            SELECT c.id, c.name, c.description, c.created_at,
                   COUNT(DISTINCT u.id) as student_count
            FROM t_p2953915_edu_schedule_platfor.classes c
            LEFT JOIN t_p2953915_edu_schedule_platfor.users u 
                ON c.id = u.class_id AND u.role = 'student'
            GROUP BY c.id, c.name, c.description, c.created_at
            ORDER BY c.name
        ''')
        
        classes = []
        for row in cursor.fetchall():
            classes.append({
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'created_at': row[3].isoformat() if row[3] else None,
                'student_count': row[4]
            })
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(classes)
        }
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        name = body.get('name')
        description = body.get('description', '')
        
        cursor.execute('''
            INSERT INTO t_p2953915_edu_schedule_platfor.classes (name, description)
            VALUES (%s, %s)
            RETURNING id, name, description, created_at
        ''', (name, description))
        
        row = cursor.fetchone()
        conn.commit()
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'created_at': row[3].isoformat() if row[3] else None
            })
        }
    
    elif method == 'DELETE':
        params = event.get('queryStringParameters', {})
        class_id = params.get('id')
        
        cursor.execute('DELETE FROM t_p2953915_edu_schedule_platfor.classes WHERE id = %s', (class_id,))
        conn.commit()
        
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True})}


def handle_teachers(method, event, cursor, conn, headers):
    if method == 'GET':
        cursor.execute('''
            SELECT u.id, u.email, u.full_name, u.subject_id, s.name as subject_name, s.color
            FROM t_p2953915_edu_schedule_platfor.users u
            LEFT JOIN t_p2953915_edu_schedule_platfor.subjects s ON u.subject_id = s.id
            WHERE u.role = 'teacher'
            ORDER BY u.full_name
        ''')
        
        teachers = []
        for row in cursor.fetchall():
            teachers.append({
                'id': row[0],
                'email': row[1],
                'full_name': row[2],
                'subject_id': row[3],
                'subject_name': row[4],
                'subject_color': row[5]
            })
        
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps(teachers)}
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        email = body.get('email')
        password = body.get('password', 'teacher123')
        full_name = body.get('full_name')
        subject_id = body.get('subject_id')
        
        cursor.execute('''
            INSERT INTO t_p2953915_edu_schedule_platfor.users 
            (email, password, role, full_name, subject_id)
            VALUES (%s, %s, 'teacher', %s, %s)
            RETURNING id, email, full_name, subject_id
        ''', (email, password, full_name, subject_id))
        
        row = cursor.fetchone()
        conn.commit()
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({'id': row[0], 'email': row[1], 'full_name': row[2], 'subject_id': row[3]})
        }
    
    elif method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        teacher_id = body.get('id')
        email = body.get('email')
        full_name = body.get('full_name')
        subject_id = body.get('subject_id')
        
        cursor.execute('''
            UPDATE t_p2953915_edu_schedule_platfor.users
            SET email = %s, full_name = %s, subject_id = %s
            WHERE id = %s AND role = 'teacher'
            RETURNING id
        ''', (email, full_name, subject_id, teacher_id))
        
        conn.commit()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True})}
    
    elif method == 'DELETE':
        params = event.get('queryStringParameters', {})
        teacher_id = params.get('id')
        
        cursor.execute('DELETE FROM t_p2953915_edu_schedule_platfor.users WHERE id = %s AND role = %s', (teacher_id, 'teacher'))
        conn.commit()
        
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True})}


def handle_homework(method, event, cursor, conn, headers):
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        class_id = params.get('class_id')
        teacher_id = params.get('teacher_id')
        
        query = '''
            SELECT h.id, h.class_id, h.subject_id, h.teacher_id, h.title, 
                   h.description, h.due_date, h.created_at,
                   s.name as subject_name, s.color as subject_color,
                   c.name as class_name,
                   u.full_name as teacher_name
            FROM t_p2953915_edu_schedule_platfor.homework h
            JOIN t_p2953915_edu_schedule_platfor.subjects s ON h.subject_id = s.id
            JOIN t_p2953915_edu_schedule_platfor.classes c ON h.class_id = c.id
            JOIN t_p2953915_edu_schedule_platfor.users u ON h.teacher_id = u.id
            WHERE 1=1
        '''
        
        params_list = []
        if class_id:
            query += ' AND h.class_id = %s'
            params_list.append(class_id)
        if teacher_id:
            query += ' AND h.teacher_id = %s'
            params_list.append(teacher_id)
        
        query += ' ORDER BY h.due_date DESC, h.created_at DESC'
        
        cursor.execute(query, params_list)
        
        homework_list = []
        for row in cursor.fetchall():
            homework_list.append({
                'id': row[0],
                'class_id': row[1],
                'subject_id': row[2],
                'teacher_id': row[3],
                'title': row[4],
                'description': row[5],
                'due_date': row[6].isoformat() if row[6] else None,
                'created_at': row[7].isoformat() if row[7] else None,
                'subject_name': row[8],
                'subject_color': row[9],
                'class_name': row[10],
                'teacher_name': row[11]
            })
        
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps(homework_list)}
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        cursor.execute('''
            INSERT INTO t_p2953915_edu_schedule_platfor.homework 
            (class_id, subject_id, teacher_id, title, description, due_date)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (body.get('class_id'), body.get('subject_id'), body.get('teacher_id'), 
              body.get('title'), body.get('description', ''), body.get('due_date')))
        
        row = cursor.fetchone()
        conn.commit()
        
        return {'statusCode': 201, 'headers': headers, 'body': json.dumps({'id': row[0]})}
    
    elif method == 'DELETE':
        params = event.get('queryStringParameters', {})
        cursor.execute('DELETE FROM t_p2953915_edu_schedule_platfor.homework WHERE id = %s', (params.get('id'),))
        conn.commit()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True})}


def handle_grades(method, event, cursor, conn, headers):
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        student_id = params.get('student_id')
        teacher_id = params.get('teacher_id')
        subject_id = params.get('subject_id')
        
        if student_id and params.get('stats') == 'true':
            cursor.execute('''
                SELECT s.name as subject_name, s.color,
                       AVG(g.grade) as avg_grade,
                       COUNT(g.id) as grade_count
                FROM t_p2953915_edu_schedule_platfor.grades g
                JOIN t_p2953915_edu_schedule_platfor.subjects s ON g.subject_id = s.id
                WHERE g.student_id = %s
                GROUP BY s.id, s.name, s.color
                ORDER BY s.name
            ''', (student_id,))
            
            stats = []
            for row in cursor.fetchall():
                stats.append({
                    'subject_name': row[0],
                    'subject_color': row[1],
                    'avg_grade': round(float(row[2]), 2) if row[2] else 0,
                    'grade_count': row[3]
                })
            
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps(stats)}
        
        query = '''
            SELECT g.id, g.student_id, g.subject_id, g.teacher_id, g.grade, 
                   g.comment, g.lesson_date, g.created_at,
                   s.name as subject_name, s.color as subject_color,
                   st.full_name as student_name,
                   t.full_name as teacher_name
            FROM t_p2953915_edu_schedule_platfor.grades g
            JOIN t_p2953915_edu_schedule_platfor.subjects s ON g.subject_id = s.id
            JOIN t_p2953915_edu_schedule_platfor.users st ON g.student_id = st.id
            JOIN t_p2953915_edu_schedule_platfor.users t ON g.teacher_id = t.id
            WHERE 1=1
        '''
        
        params_list = []
        if student_id:
            query += ' AND g.student_id = %s'
            params_list.append(student_id)
        if teacher_id:
            query += ' AND g.teacher_id = %s'
            params_list.append(teacher_id)
        if subject_id:
            query += ' AND g.subject_id = %s'
            params_list.append(subject_id)
        
        query += ' ORDER BY g.lesson_date DESC, g.created_at DESC'
        
        cursor.execute(query, params_list)
        
        grades = []
        for row in cursor.fetchall():
            grades.append({
                'id': row[0],
                'student_id': row[1],
                'subject_id': row[2],
                'teacher_id': row[3],
                'grade': row[4],
                'comment': row[5],
                'lesson_date': row[6].isoformat() if row[6] else None,
                'created_at': row[7].isoformat() if row[7] else None,
                'subject_name': row[8],
                'subject_color': row[9],
                'student_name': row[10],
                'teacher_name': row[11]
            })
        
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps(grades)}
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        cursor.execute('''
            INSERT INTO t_p2953915_edu_schedule_platfor.grades 
            (student_id, subject_id, teacher_id, grade, comment, lesson_date)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (body.get('student_id'), body.get('subject_id'), body.get('teacher_id'),
              body.get('grade'), body.get('comment', ''), body.get('lesson_date')))
        
        row = cursor.fetchone()
        conn.commit()
        
        return {'statusCode': 201, 'headers': headers, 'body': json.dumps({'id': row[0]})}
    
    elif method == 'DELETE':
        params = event.get('queryStringParameters', {})
        cursor.execute('DELETE FROM t_p2953915_edu_schedule_platfor.grades WHERE id = %s', (params.get('id'),))
        conn.commit()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True})}
