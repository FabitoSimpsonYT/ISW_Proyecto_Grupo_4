import { query } from '../config/database.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { is_read, limit = 50 } = req.query;
    
    let sql = `
      SELECT n.*, 
             e.title as event_title,
             e.start_time as event_start_time
      FROM notifications n
      LEFT JOIN events e ON n.related_event_id = e.id
      WHERE n.user_id = $1
    `;
    
    const params = [req.user.id];
    let paramCount = 2;
    
    if (is_read !== undefined) {
      sql += ` AND n.is_read = $${paramCount}`;
      params.push(is_read === 'true');
      paramCount++;
    }
    
    sql += ` ORDER BY n.created_at DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    const result = await query(sql, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Notificación marcada como leída',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );
    
    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );
    
    res.json({
      success: true,
      count: parseInt(result.rows[0].count)
    });
  } catch (error) {
    next(error);
  }
};