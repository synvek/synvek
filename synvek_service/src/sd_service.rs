use libloading::{Library, Symbol};
use std::ffi::{CStr, CString, OsString, c_char, c_int};
use std::marker::PhantomData;
use std::{fs, ptr};
use std::ptr::null_mut;
use base64::{Engine as _, engine::{self, general_purpose}, alphabet};
use base64::engine::general_purpose::STANDARD;

#[repr(C)]
pub struct ImageOutput {
    _private: PhantomData<()>,
}

type GenerateImageData = unsafe fn(c_int, *const *const c_char) -> *mut ImageOutput;
type GetImageCount = unsafe fn(*mut ImageOutput) -> usize;
type GetImageDataLength = unsafe fn(*mut ImageOutput, usize) -> usize;
type GetImageData = unsafe fn(*mut ImageOutput, usize) -> *const u8;
type FreeImageData = unsafe fn(*mut ImageOutput);

pub fn generate_image(image_args: &Vec<String>) -> Vec<String> {
    let mut output: Vec<String> = vec![];
    unsafe {
        let lib = Library::new("synvek_backend_sd.dll");
        if let Ok(lib) = lib {
            let generate_image_data_func = lib.get(b"generate_image_data");
            let get_image_count_func = lib.get(b"get_image_count");
            let get_image_data_length_func = lib.get(b"get_image_data_length");
            let get_image_data_func = lib.get(b"get_image_data");
            let free_image_data_func = lib.get(b"free_image_data");
            match (generate_image_data_func, get_image_count_func,get_image_data_length_func, get_image_data_func, free_image_data_func) {
                (Ok(generate_image_data_func), Ok(get_image_count_func), Ok(get_image_data_length_func), Ok(get_image_data_func), Ok(free_image_data_func)) => {
                    let generate_image_data: Symbol<GenerateImageData> = generate_image_data_func;
                    let get_image_count: Symbol<GetImageCount> = get_image_count_func;
                    let get_image_data_length: Symbol<GetImageDataLength> = get_image_data_length_func;
                    let get_image_data: Symbol<GetImageData> = get_image_data_func;
                    let free_image_data: Symbol<FreeImageData> = free_image_data_func;
                    //sd.exe --diffusion-model  C:\source\works\synvek\output\models\models--leejet--FLUX.1-schnell-gguf\snapshots\c7f665ddaf9f197ff493f41fc211f5480f5f19ac\flux1-schnell-q4_0.gguf
                    // --vae C:\source\works\synvek\output\models\models--black-forest-labs--FLUX.1-schnell\snapshots\741f7c3ce8b383c54771c7003378a50191e9efe9\ae.safetensors
                    // --clip_l C:\source\works\synvek\output\models\models--comfyanonymous--flux_text_encoders\snapshots\6af2a98e3f615bdfa612fbd85da93d1ed5f69ef5\clip_l.safetensors
                    // --t5xxl C:\source\works\synvek\output\models\models--comfyanonymous--flux_text_encoders\snapshots\6af2a98e3f615bdfa612fbd85da93d1ed5f69ef5\t5xxl_fp16.safetensors
                    // -p "a lovely cat holding a sign says 'flux.cpp'" --cfg-scale 1.0 --sampling-method euler -v --steps 4 --clip-on-cpu
                    let start_args: Vec<String> = vec![
                        String::from("synvek_service"),
                        String::from("--diffusion-model"),
                        String::from("C:\\source\\works\\synvek\\output\\models\\models--leejet--FLUX.1-schnell-gguf\\snapshots\\c7f665ddaf9f197ff493f41fc211f5480f5f19ac\\flux1-schnell-q4_0.gguf", ),
                        String::from("--vae"),
                        String::from("C:\\source\\works\\synvek\\output\\models\\models--black-forest-labs--FLUX.1-schnell\\snapshots\\741f7c3ce8b383c54771c7003378a50191e9efe9\\ae.safetensors", ),
                        String::from("--clip_l"),
                        String::from("C:\\source\\works\\synvek\\output\\models\\models--comfyanonymous--flux_text_encoders\\snapshots\\6af2a98e3f615bdfa612fbd85da93d1ed5f69ef5\\clip_l.safetensors", ),
                        String::from("--t5xxl"),
                        String::from("C:\\source\\works\\synvek\\output\\models\\models--comfyanonymous--flux_text_encoders\\snapshots\\6af2a98e3f615bdfa612fbd85da93d1ed5f69ef5\\t5xxl_fp16.safetensors", ),
                        String::from("-p"),
                        String::from("a lovely cat holding a sign says 'flux.cpp'"),
                        String::from("--cfg-scale"),
                        String::from("1.0"),
                        String::from("--sampling-method"),
                        String::from("euler"),
                        String::from("-v"),
                        String::from("--steps"),
                        String::from("4"),
                        String::from("--clip-on-cpu"),
                    ];
                    let c_start_strings = start_args
                        .iter()
                        .map(|s| CString::new(s.as_str()))
                        .collect::<anyhow::Result<Vec<_>, _>>();
                    if let Ok(c_start_strings) = c_start_strings {
                        let raw_ptrs: Vec<*const c_char> =
                            c_start_strings.iter().map(|cs| cs.as_ptr()).collect();
                        let image_output = generate_image_data(
                            start_args.len() as c_int,
                            raw_ptrs.as_ptr(),
                        );

                        if image_output == null_mut() {
                            panic!("Failed to get string array from DLL");
                        }

                        let image_count = get_image_count(image_output);
                        tracing::info!("Image count = {}", image_count);
                        for i in 0..image_count {
                            let image_data_length = get_image_data_length(image_output, i);
                            let image_data = get_image_data(image_output, i);
                            let image_data_slice: &[u8] = std::slice::from_raw_parts(image_data, image_data_length);
                            tracing::info!("Image data = {:?}", image_data_slice.len());
                            let base64_string = STANDARD.encode(image_data_slice);
                            let data_url = format!("data:image/png;base64,{}", base64_string);
                            output.push(data_url);
                        }
                        tracing::info!("Image generation is finished and release resource now");
                        free_image_data(image_output);
                        tracing::info!("Resource release is done.");
                    }
                }
                _ => {}
            }
        }
    }
    output
}
