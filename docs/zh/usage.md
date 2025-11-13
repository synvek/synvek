# 使用指南

## 选择模型和下载模型

点设置按钮进入设置界面，选择模型搜索界面，选择希望使用的模型点击下载, 点击后即可在本地模型标签页看到该模型下载进度状态。

如果huggingface访问有问题，可以填写合适的镜像地址，有些模型需要访问令牌(Access Token)，为了下载该模型需要到huggingface注册并配置才能下载。

如果本地已存在gguf模型文件也可以直接复制到模型下载目录，应用会自动识别gguf模型文件并使用。针对gguf模型建议使用llama.cpp引擎

如果您在中国国内可以选择modelscope（魔塔）模型源，可以有更好更稳定的下载速度

下载模型默认保存路径如下：

- Windows

    %USER_PROFILE%\AppData\Roaming\synvek\SynvekExplorer\data\models
    
- Macos

    /Users/$USER/Library/Application Support/com.Synvek.SynvekExplorer/models

- Ubuntu

    /home/$USER/.local/share/synvekexplorer

## 用法    

### 对话完成：以gpt-oss-20b-gguf为例

- 进入设置标签页，选择模型下载gps-oss-20b-gguf模型

- 进入设置标签页，选择模型搜索，选择gps-oss-20b-gguf，选择下载，弹出下载窗口后可直接使用默认值点确定后进行下载。

- 在聊天标签页，选择本地模型可以看到本地模型下载状态，等待模型下载完成。

- 进入对话标签页，点模型下拉选择框选择gps-oss-20b-gguf，将模型设置为默认对话模型，启动模型后即可开始对话

![GPT-OSS](/usage_gpt_oss_20b.jpg)

### 文本生成图像：以FLUX.1-schnell-gguf为例

- 进入设置标签页，选择模型下载FLUX.1-schnell-gguf模型

- 进入设置标签页，选择模型搜索，选择FLUX.1-schnell-gguf，选择下载，弹出下载窗口后可直接使用默认值点确定后进行下载。

- 在聊天标签页，选择本地模型可以看到本地模型下载状态，等待模型下载完成。

- 进入对话标签页，点模型下拉选择框选择FLUX.1-schnell-gguf，将模型设置为默认对话模型，启动模型后即可开始对话

![GPT-OSS](/usage_flux_schell.jpg)

### 图像生成文本：以Phi-4-multimodal-instruct为例

- 进入设置标签页，选择模型下载Phi-4-multimodal-instruct模型

- 进入设置标签页，选择模型搜索，选择Phi-4-multimodal-instruct，选择下载，弹出下载窗口后可直接使用默认值点确定后进行下载。

- 在聊天标签页，选择本地模型可以看到本地模型下载状态，等待模型下载完成。

- 进入对话标签页，点模型下拉选择框选择Phi-4-multimodal-instruct，将模型设置为默认对话模型，启动模型后即可开始对话

- 对话时首先点附件添加您希望分析的图片文件，然后输入问题后，按回车即可开始生成

![GPT-OSS](/usage_text_2_image_input.jpg)
![GPT-OSS](/usage_text_2_image_output.jpg)

### 文本生成语音：以Dia-1.6B为例

- 进入设置标签页，选择模型下载Dia-1.6B模型

- 进入设置标签页，选择模型搜索，选择Dia-1.6B，选择下载，弹出下载窗口后可直接使用默认值点确定后进行下载。

- 在聊天标签页，选择本地模型可以看到本地模型下载状态，等待模型下载完成。

- 进入对话标签页，点模型下拉选择框选择Dia-1.6B，将模型设置为默认对话模型，启动模型后即可开始对话。

![GPT-OSS](/usage_dia.jpg)