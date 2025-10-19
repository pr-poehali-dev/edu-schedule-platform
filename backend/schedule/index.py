'''
Business: Управление расписанием занятий (CRUD операции)
Args: event - dict with httpMethod, body, queryStringParameters
      context - object with attributes: request_id, function_name
Returns: HTTP response dict with schedule data or error
'''

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    db_url = os.environ.get('DATABASE_URL')
    
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # GET - получить все расписание
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            class_id = params.get('class_id')
            
            if class_id:
                query = f"SELECT s.*, sub.name as subject_name, sub.color as subject_color, c.name as class_name FROM t_p2953915_edu_schedule_platfor.schedule s LEFT JOIN t_p2953915_edu_schedule_platfor.subjects sub ON s.subject_id = sub.id LEFT JOIN t_p2953915_edu_schedule_platfor.classes c ON s.class_id = c.id WHERE s.class_id = {class_id} ORDER BY s.lesson_date DESC NULLS LAST, CASE s.day_of_week WHEN 'monday' THEN 1 WHEN 'tuesday' THEN 2 WHEN 'wednesday' THEN 3 WHEN 'thursday' THEN 4 WHEN 'friday' THEN 5 WHEN 'saturday' THEN 6 WHEN 'sunday' THEN 7 END, s.time_start"
            else:
                query = "SELECT s.*, sub.name as subject_name, sub.color as subject_color, c.name as class_name FROM t_p2953915_edu_schedule_platfor.schedule s LEFT JOIN t_p2953915_edu_schedule_platfor.subjects sub ON s.subject_id = sub.id LEFT JOIN t_p2953915_edu_schedule_platfor.classes c ON s.class_id = c.id ORDER BY s.lesson_date DESC NULLS LAST, CASE s.day_of_week WHEN 'monday' THEN 1 WHEN 'tuesday' THEN 2 WHEN 'wednesday' THEN 3 WHEN 'thursday' THEN 4 WHEN 'friday' THEN 5 WHEN 'saturday' THEN 6 WHEN 'sunday' THEN 7 END, s.time_start"
            
            cur.execute(query)
            schedules = cur.fetchall()
            
            result = [dict(s) for s in schedules]
            for item in result:
                if item.get('time_start'):
                    item['time_start'] = str(item['time_start'])
                if item.get('time_end'):
                    item['time_end'] = str(item['time_end'])
                if item.get('created_at'):
                    item['created_at'] = item['created_at'].isoformat()
                if item.get('lesson_date'):
                    item['lesson_date'] = item['lesson_date'].isoformat()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'schedules': result})
            }
        
        # POST - создать новую запись
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            day = body_data.get('day_of_week', '')
            time_start = body_data.get('time_start', '')
            time_end = body_data.get('time_end', '')
            subject = body_data.get('subject', '')
            subject_id = body_data.get('subject_id', '')
            teacher = body_data.get('teacher', '')
            notes = body_data.get('notes', '')
            lesson_date = body_data.get('lesson_date', '')
            class_id = body_data.get('class_id', '')
            teacher_id = body_data.get('teacher_id', '')
            
            subject_id_value = f"{subject_id}" if subject_id else "NULL"
            lesson_date_value = f"'{lesson_date}'" if lesson_date else "NULL"
            class_id_value = f"{class_id}" if class_id else "NULL"
            teacher_id_value = f"{teacher_id}" if teacher_id else "NULL"
            
            query = f"""
                INSERT INTO t_p2953915_edu_schedule_platfor.schedule (day_of_week, time_start, time_end, subject, subject_id, teacher, notes, lesson_date, class_id, teacher_id) 
                VALUES ('{day}', '{time_start}', '{time_end}', '{subject}', {subject_id_value}, '{teacher}', '{notes}', {lesson_date_value}, {class_id_value}, {teacher_id_value})
                RETURNING id
            """
            cur.execute(query)
            result = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({
                    'success': True,
                    'id': result['id']
                })
            }
        
        # PUT - обновить запись
        if method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            schedule_id = body_data.get('id')
            day = body_data.get('day_of_week', '')
            time_start = body_data.get('time_start', '')
            time_end = body_data.get('time_end', '')
            subject = body_data.get('subject', '')
            subject_id = body_data.get('subject_id', '')
            teacher = body_data.get('teacher', '')
            notes = body_data.get('notes', '')
            lesson_date = body_data.get('lesson_date', '')
            class_id = body_data.get('class_id', '')
            teacher_id = body_data.get('teacher_id', '')
            
            subject_id_value = f"{subject_id}" if subject_id else "NULL"
            lesson_date_value = f"'{lesson_date}'" if lesson_date else "NULL"
            class_id_value = f"{class_id}" if class_id else "NULL"
            teacher_id_value = f"{teacher_id}" if teacher_id else "NULL"
            
            query = f"""
                UPDATE t_p2953915_edu_schedule_platfor.schedule 
                SET day_of_week = '{day}', time_start = '{time_start}', time_end = '{time_end}',
                    subject = '{subject}', subject_id = {subject_id_value}, teacher = '{teacher}', notes = '{notes}', lesson_date = {lesson_date_value},
                    class_id = {class_id_value}, teacher_id = {teacher_id_value}
                WHERE id = {schedule_id}
            """
            cur.execute(query)
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'success': True})
            }
        
        # DELETE - удалить запись
        if method == 'DELETE':
            params = event.get('queryStringParameters', {})
            schedule_id = params.get('id', '')
            
            query = f"DELETE FROM t_p2953915_edu_schedule_platfor.schedule WHERE id = {schedule_id}"
            cur.execute(query)
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'success': True})
            }
        
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)})
        }
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()