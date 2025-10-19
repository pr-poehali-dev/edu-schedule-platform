import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление школьными предметами
    Args: event - dict с httpMethod, body, queryStringParameters
          context - объект с атрибутами: request_id, function_name
    Returns: HTTP response dict
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
    cur = conn.cursor()
    
    if method == 'GET':
        cur.execute('SELECT id, name, color, created_at FROM subjects ORDER BY name')
        rows = cur.fetchall()
        subjects = [{'id': r[0], 'name': r[1], 'color': r[2], 'created_at': r[3].isoformat()} for r in rows]
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps(subjects)
        }
    
    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        name = body.get('name', '').strip()
        color = body.get('color', '#3b82f6')
        
        if not name:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Название предмета обязательно'})
            }
        
        cur.execute(
            'INSERT INTO subjects (name, color) VALUES (%s, %s) RETURNING id, name, color, created_at',
            (name, color)
        )
        row = cur.fetchone()
        conn.commit()
        subject = {'id': row[0], 'name': row[1], 'color': row[2], 'created_at': row[3].isoformat()}
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps(subject)
        }
    
    if method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        subject_id = body.get('id')
        name = body.get('name', '').strip()
        color = body.get('color', '#3b82f6')
        
        if not subject_id or not name:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'ID и название обязательны'})
            }
        
        cur.execute(
            'UPDATE subjects SET name = %s, color = %s WHERE id = %s RETURNING id, name, color, created_at',
            (name, color, subject_id)
        )
        row = cur.fetchone()
        conn.commit()
        
        if not row:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Предмет не найден'})
            }
        
        subject = {'id': row[0], 'name': row[1], 'color': row[2], 'created_at': row[3].isoformat()}
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps(subject)
        }
    
    if method == 'DELETE':
        params = event.get('queryStringParameters', {})
        subject_id = params.get('id')
        
        if not subject_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'ID обязателен'})
            }
        
        cur.execute('UPDATE schedule SET subject_id = NULL WHERE subject_id = %s', (subject_id,))
        cur.execute('DELETE FROM subjects WHERE id = %s RETURNING id', (subject_id,))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        if not row:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Предмет не найден'})
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'success': True})
        }
    
    cur.close()
    conn.close()
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Метод не поддерживается'})
    }
