'''
Business: Управление учениками (создание, просмотр, удаление)
Args: event - dict with httpMethod, body, queryStringParameters
      context - object with attributes: request_id, function_name
Returns: HTTP response dict with students data or error
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
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
        
        # GET - получить всех учеников
        if method == 'GET':
            query = """
                SELECT u.id, u.email, u.full_name, u.created_at, u.class_id, c.name as class_name
                FROM t_p2953915_edu_schedule_platfor.users u
                LEFT JOIN t_p2953915_edu_schedule_platfor.classes c ON u.class_id = c.id
                WHERE u.role = 'student' 
                ORDER BY u.created_at DESC
            """
            cur.execute(query)
            students = cur.fetchall()
            
            result = [dict(s) for s in students]
            for item in result:
                if item.get('created_at'):
                    item['created_at'] = item['created_at'].isoformat()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'students': result})
            }
        
        # POST - создать нового ученика
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            email = body_data.get('email', '').replace("'", "''")
            password = body_data.get('password', '').replace("'", "''")
            full_name = body_data.get('full_name', '').replace("'", "''")
            class_id = body_data.get('class_id')
            
            if class_id:
                query = f"""
                    INSERT INTO t_p2953915_edu_schedule_platfor.users (email, password, role, full_name, class_id) 
                    VALUES ('{email}', '{password}', 'student', '{full_name}', {class_id})
                    RETURNING id
                """
            else:
                query = f"""
                    INSERT INTO t_p2953915_edu_schedule_platfor.users (email, password, role, full_name) 
                    VALUES ('{email}', '{password}', 'student', '{full_name}')
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
        
        # DELETE - удалить ученика
        if method == 'DELETE':
            params = event.get('queryStringParameters', {})
            student_id = params.get('id', '')
            
            query = f"DELETE FROM t_p2953915_edu_schedule_platfor.users WHERE id = {student_id} AND role = 'student'"
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