delete from folder;
delete from conversion;
delete from chat;
delete from attachment;
delete from generation;

insert into conversion(conversion_id, conversion_name, folder_id, updated_date, created_date)
values(1, 'Default Chat', null, null, null);
