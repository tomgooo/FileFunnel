# 约定术语：

- 顺序表 (SequenceList)

  - **临时选择顺序表(Ordered File Selection List)** :前端: 在文件选择框中，前端维护一个`临时选择顺序表(Ordered File Selection List)`。他按照用户选择的文件先后顺序，插入到表中，当用户点击"add"之后，这个临时的顺序表按照顺序，把名字，绝对路径地址，(不包括顺序值)按照先后顺序插入到后端维护的顺序表之中。
  - **顺序表(SequenceList)** : 
    - **前端**:前端实时**显示**由后端维护的**顺序表(SequenceList)**
    - **后端**:按照前端从**临时选择顺序表(Ordered File Selection List)**中"add"过来的, `文件名字`--`绝对路径地址`----`顺序值`，维护一个表，表由map维护，按照顺序值为索引排序，保存`文件名字`--`绝对路径地址`----`顺序值`三个信息。

- 顺序值 (Order)

  - **临时选择顺序表(Ordered File Selection List)-----> 顺序值Order value**。这个顺序值来源于 `临时选择顺序表(Ordered File Selection List)`, 只用来给`临时选择顺序表(Ordered File Selection List)`中的文件排序，当用户点击"add"之后，前端将按照这个值的大小顺序排序，添加到后端维护的顺序表里面。
  - **顺序表(SequenceList)----->顺序值 (Order)**。这个顺序值来源于`顺序表(SequenceList)`，顺序表按照顺序值排序，按照顺序值依次把文件复制粘贴到**目标文件夹 (Target Folder)**

- 源文件 (Source File)

  来源于不同文件夹或者相同文件夹的文件。

- 目标文件夹 (Target Folder)

  只有单个目标文件夹。

- 复制计划 (CopyPlan)

- 复制任务 (CopyJob)

- 缺失文件对话框 / 结果对话框 等

​	